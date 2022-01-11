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
    ProviderBackup,
    ProviderInput,
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

            expect(publishResult).toEqual([appointment]);
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
            const appointments3 = await anonymousApi.getAppointments(
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
            provider2 = await createUnverifiedProvider(providerKeyPairs2, {
                name: "Max Mustermann",
                street: "Musterstr. 23",
                city: "Berlin",
                zipCode: "10707",
                description: "",
                email: "max@mustermann.de",
                accessible: false,
                website: "https://eff.org/",
                foo: "bar",
            } as ProviderInput);
        });

        it("should retrieve no data while provider is pending", async () => {
            const result = await providerApi.checkProvider(providerKeyPairs2);

            expect(result.verifiedProvider).toBeNull();
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

            expect(result2).toEqual(provider2);
        });

        it("should get data for verified provider", async () => {
            const result3 = await providerApi.checkProvider(providerKeyPairs2);

            expect(result3.verifiedProvider).toEqual(provider2);
        });

        it("should update provider", async () => {
            await providerApi.storeProvider(
                {
                    ...provider2,
                    name: "foobar",
                },
                providerKeyPairs2
            );

            const providerData = await providerApi.checkProvider(
                providerKeyPairs2
            );

            expect(providerData?.verifiedProvider).toEqual(provider2);
        });
    });

    describe("appointment-series", () => {
        it("should create and publish series", async () => {
            const startAt = dayjs()
                .utc()
                .add(1, "day")
                .hour(7)
                .minute(0)
                .second(0)
                .toDate();
            const endAt = dayjs()
                .utc()
                .add(1, "day")
                .hour(23)
                .minute(0)
                .second(0)
                .toDate();

            const appointmentSeries = providerApi.createAppointmentSeries(
                startAt,
                endAt,
                5,
                5,
                "biontech",
                provider,
                providerKeyPairs
            );

            expect(appointmentSeries.appointments).toHaveLength(192);

            const result = await providerApi.publishAppointments(
                appointmentSeries.appointments,
                providerKeyPairs
            );

            expect(result).toHaveLength(192);
            expect(result).toEqual(appointmentSeries.appointments);

            expect(result[0].properties.seriesId).toEqual(
                appointmentSeries.appointments[0].properties.seriesId
            );
        });
    });

    describe("backup", () => {
        it("should backup and restore", async () => {
            const secret = providerApi.generateSecret();

            const providerBackup: ProviderBackup = {
                verifiedProvider: provider,
            };

            const result = await providerApi.backupData(providerBackup, secret);

            expect(result).toHaveProperty("data");

            const restore = await providerApi.restoreFromBackup(secret);

            expect(providerBackup).toEqual(restore);
        });
    });
});
