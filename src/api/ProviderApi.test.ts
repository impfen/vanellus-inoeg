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
    Provider,
    ProviderKeyPairs,
} from "./interfaces";
import { ProviderApi } from "./ProviderApi";

let mediatorApi: MediatorApi;
let mediatorKeyPairs: MediatorKeyPairs;
let providerApi: ProviderApi;
let provider: Provider;
let providerKeyPairs: ProviderKeyPairs;
let anonymousApi: AnonymousApi;

beforeAll(async () => {
    const { adminApi, adminKeyPairs } = await getAdminApi();

    await adminApi.resetDb(adminKeyPairs);

    const providerResult = await getProviderApi();

    providerApi = providerResult.providerApi;
    providerKeyPairs = providerResult.providerKeyPairs;

    anonymousApi = getAnonymousApi();

    const mediatorResult = await getMediatorApi({ adminKeyPairs });

    mediatorApi = mediatorResult.mediatorApi;
    mediatorKeyPairs = mediatorResult.mediatorKeyPairs;

    provider = await createVerifiedProvider(providerKeyPairs, mediatorKeyPairs);
});

describe("ProviderApi", () => {
    describe("cancel appointments", () => {
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

            appointment = providerApi.createAppointment(
                date,
                15,
                "moderna",
                5,
                provider,
                providerKeyPairs
            );
        });

        it("should publish appointments", async () => {
            const publishResult = await providerApi.publishAppointments(
                [appointment],
                providerKeyPairs
            );

            expect(publishResult).toHaveLength(1);
        });

        it("should retrieve published appointments", async () => {
            const appointments1 = await providerApi.getProviderAppointments(
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
                from,
                to,
                10
            );

            expect(appointments3).toHaveLength(0);
        });
    });

    describe("verify a provider", () => {
        let provider2: Provider;
        let providerKeyPairs2: ProviderKeyPairs;
        const from = dayjs().utc().toDate();
        const to = dayjs().utc().add(1, "day").toDate();

        it("should create new provider", async () => {
            providerKeyPairs2 = await providerApi.generateKeyPairs();
            provider2 = await createUnverifiedProvider(providerKeyPairs2);
        });

        it("should retrieve no data while provider is pending", async () => {
            const result = await providerApi.checkProvider(providerKeyPairs2);

            expect(result).toBeNull();
        });

        it("should not get own appointments while provider is unverified", async () => {
            const result = await providerApi.getProviderAppointments(
                from,
                to,
                providerKeyPairs2
            );

            expect(result).toHaveLength(0);
        });

        it("should get pending providers", async () => {
            const providerDatas = await mediatorApi.getPendingProviders(
                mediatorKeyPairs
            );

            expect(providerDatas).toHaveLength(1);
        });

        it("should verify provider", async () => {
            const result2 = await mediatorApi.confirmProvider(
                provider2,
                mediatorKeyPairs
            );

            expect(result2).toHaveProperty("name");
        });

        it("should get data for verified provider", async () => {
            const result3 = await providerApi.checkProvider(providerKeyPairs2);

            expect(result3).toHaveProperty("name");
        });
    });
});
