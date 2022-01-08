import { AnonymousApi, MediatorApi } from ".";
import {
    createUnverifiedProvider,
    createVerifiedProvider,
    getAdminApi,
    getAnonymousApi,
    getMediatorApi,
    getProviderApi,
} from "../../tests/test-utils";
import { dayjs } from "../utils";
import {
    Appointment,
    MediatorKeyPairs,
    ProviderData,
    ProviderKeyPairs,
    UnpublishedAppointment,
} from "./interfaces";
import { ProviderApi } from "./ProviderApi";

let mediatorApi: MediatorApi;
let mediatorKeyPairs: MediatorKeyPairs;
let providerApi: ProviderApi;
let providerKeyPairs: ProviderKeyPairs;
let anonymousApi: AnonymousApi;

beforeAll(async () => {
    const { adminApi, adminKeyPairs } = await getAdminApi();

    await adminApi.resetAppointmentsDb(adminKeyPairs);

    const providerResult = await getProviderApi();

    providerApi = providerResult.providerApi;
    providerKeyPairs = providerResult.providerKeyPairs;

    const mediatorResult = await getMediatorApi({ adminKeyPairs });

    anonymousApi = getAnonymousApi();

    mediatorApi = mediatorResult.mediatorApi;
    mediatorKeyPairs = mediatorResult.mediatorKeyPairs;

    await createVerifiedProvider(providerKeyPairs, mediatorKeyPairs);
});

describe("ProviderApi", () => {
    describe("cancel appointments", () => {
        let unpublishedAppointment: UnpublishedAppointment;
        let appointment: Appointment;
        const from = dayjs().utc().toDate();
        const to = dayjs().utc().add(1, "day").toDate();

        it("should create appointments", () => {
            // tomorrow 3 pm
            const date = dayjs()
                .utc()
                .add(1, "day")
                .hour(15)
                .minute(0)
                .second(0)
                .toDate();

            unpublishedAppointment = providerApi.createAppointment(
                15,
                "moderna",
                5,
                date
            );
        });

        it("should publish appointments", async () => {
            const publishResult = await providerApi.publishAppointments(
                [unpublishedAppointment],
                providerKeyPairs
            );

            expect(publishResult).toHaveLength(1);

            if (publishResult?.[0]) {
                appointment = publishResult[0];
            }
        });

        it("should retrieve published appointments", async () => {
            const appointments1 = await providerApi.getAppointments(
                from,
                to,
                providerKeyPairs
            );

            expect(appointments1).toHaveLength(1);
        });

        it("should cancel appointments", async () => {
            await providerApi.cancelAppointment(appointment, providerKeyPairs);
        });

        it("should not retrieve canceled appointments", async () => {
            const appointments3 = await anonymousApi.getAppointmentsByZipCode(
                "10707",
                10,
                from,
                to
            );

            expect(appointments3).toHaveLength(0);
        });
    });

    describe("confirming a provider", () => {
        let provider2: ProviderData;
        let providerKeyPairs2: ProviderKeyPairs;

        it("should create new provider", async () => {
            providerKeyPairs2 = await providerApi.generateKeyPairs();
            provider2 = await createUnverifiedProvider(providerKeyPairs2);
        });

        it("should retrieve no data while provider is pending", async () => {
            const checkResult = await providerApi.checkData(providerKeyPairs2);

            expect(checkResult).toBeNull();
        });

        it("should get pending providers", async () => {
            const providerDatas = await mediatorApi.getPendingProviders(
                mediatorKeyPairs
            );

            expect(providerDatas).toHaveLength(1);
        });

        it("should confirm provider", async () => {
            const result2 = await mediatorApi.confirmProvider(
                provider2,
                mediatorKeyPairs
            );

            expect(result2).toHaveProperty("name");
        });

        it("should get data for confirmed provider", async () => {
            const result3 = await providerApi.checkData(providerKeyPairs2);

            expect(result3).toHaveProperty("name");
        });
    });
});