// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { ProviderBackup } from "../interfaces";
import { dayjs } from "../utils";
import { TestContext } from "./TestContext";

describe("ProviderApi", () => {
    describe("Keys and secret", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        it("should generate secrets", () => {
            const secret = context.providerApi.generateSecret();

            expect(secret).toHaveLength(24);
        });

        it("should generate key-pairs", async () => {
            const providerKeyPairs =
                await context.providerApi.generateKeyPairs();

            expect(providerKeyPairs).toBeDefined();
            expect(providerKeyPairs).toHaveProperty("sync");
            expect(providerKeyPairs).toHaveProperty("signing");
            expect(providerKeyPairs).toHaveProperty("data");
            expect(providerKeyPairs).toHaveProperty("encryption");
        });
    });

    describe("Providers", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        const from = dayjs().utc().toDate();
        const to = dayjs().utc().add(1, "day").toDate();

        it("should create new provider", async () => {
            const providerKeyPairs =
                await context.providerApi.generateKeyPairs();

            const provider = await context.providerApi.storeProvider(
                context.defaultProviderData,
                providerKeyPairs
            );

            expect(provider).toHaveProperty("id");
            expect(provider.name).toEqual(context.defaultProviderData.name);
            expect(provider.street).toEqual(context.defaultProviderData.street);
            expect(provider.city).toEqual(context.defaultProviderData.city);
            expect(provider.zipCode).toEqual(
                context.defaultProviderData.zipCode
            );
            expect(provider.description).toEqual(
                context.defaultProviderData.description
            );
            expect(provider.email).toEqual(context.defaultProviderData.email);
            expect(provider.accessible).toEqual(
                context.defaultProviderData.accessible
            );

            expect(provider.name).toEqual(context.defaultProviderData.name);
        });

        it("should retrieve no data while provider is pending", async () => {
            const { providerKeyPairs } =
                await context.createUnverifiedProvider();

            const { verifiedProvider } =
                await context.providerApi.checkProvider(providerKeyPairs);

            expect(verifiedProvider).toBeNull();
        });

        it("should not get own appointments while provider is pending", async () => {
            const { providerKeyPairs } =
                await context.createUnverifiedProvider();

            const result = await context.providerApi.getProviderAppointments(
                from,
                to,
                providerKeyPairs
            );

            expect(result).toHaveLength(0);
        });

        it("should get pending providers", async () => {
            const { provider } = await context.createUnverifiedProvider();

            const pendingProviders =
                await context.mediatorApi.getPendingProviders(
                    context.mediatorKeyPairs
                );

            expect(pendingProviders).toEqual([provider]);
        });

        it("should verify provider", async () => {
            const { provider } = await context.createUnverifiedProvider();

            const result = await context.mediatorApi.confirmProvider(
                provider,
                context.mediatorKeyPairs
            );

            expect(result).toEqual(provider);
        });

        it("should get data for verified provider", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const { verifiedProvider } =
                await context.providerApi.checkProvider(providerKeyPairs);

            expect(verifiedProvider).toEqual(provider);
        });

        it("should update provider", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            await context.providerApi.storeProvider(
                {
                    ...provider,
                    name: "foobar",
                },
                providerKeyPairs
            );

            const providerData = await context.providerApi.checkProvider(
                providerKeyPairs
            );

            expect(providerData?.verifiedProvider).toEqual(provider);
        });
    });

    describe("Appointments", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        const from = dayjs().utc().toDate();
        const to = dayjs().utc().add(1, "day").toDate();

        it("should create appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            // tomorrow 3 pm
            const date = dayjs()
                .utc()
                .add(1, "day")
                .hour(15)
                .minute(0)
                .second(0)
                .toDate();

            const appointment = context.providerApi.createAppointment(
                date,
                15,
                "moderna",
                5,
                provider,
                providerKeyPairs
            );

            expect(appointment).toHaveProperty("id");
            expect(appointment.startDate).toEqual(date);
        });

        it("should publish appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = context.createUnpublishedAppointment({
                provider,
                providerKeyPairs,
            });

            const publishResult = await context.providerApi.publishAppointments(
                [appointment],
                providerKeyPairs
            );

            expect(publishResult).toEqual([appointment]);
        });

        it("should update appointments", async () => {
            const { userQueueToken } = await context.createUserQueueToken();

            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            await context.userApi.bookAppointment(appointment, userQueueToken);

            appointment.slotData = [
                appointment.slotData[2],
                appointment.slotData[1],
                appointment.slotData[4],
            ];

            appointment.duration = 31;
            appointment.properties.vaccine = "moderna";

            const publishResult = await context.providerApi.updateAppointment(
                appointment,
                providerKeyPairs
            );

            const appointments =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            expect(appointments[0].duration).toEqual(publishResult.duration);
            expect(appointments[0].properties).toEqual(
                publishResult.properties
            );
        });

        it("should retrieve published appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const appointments =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            expect(appointments[0].id).toEqual(appointment.id);
        });

        it("should cancel appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const result = await context.providerApi.cancelAppointment(
                appointment,
                providerKeyPairs
            );

            expect(result.slotData).toHaveLength(0);
        });

        it("should not retrieve canceled appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            await context.providerApi.cancelAppointment(
                appointment,
                providerKeyPairs
            );

            const appointments = await context.anonymousApi.getAppointments(
                context.defaultProviderData.zipCode,
                from,
                to
            );

            expect(appointments).toHaveLength(0);
        });
    });

    describe("AppointmentSeries", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        it("should create and publish series", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const startAt = dayjs()
                .utc()
                .add(1, "day")
                .hour(10)
                .minute(0)
                .second(0)
                .toDate();

            const endAt = dayjs()
                .utc()
                .add(1, "day")
                .hour(15)
                .minute(0)
                .second(0)
                .toDate();

            const appointmentSeries =
                context.providerApi.createAppointmentSeries(
                    startAt,
                    endAt,
                    5,
                    5,
                    "biontech",
                    provider,
                    providerKeyPairs
                );

            expect(appointmentSeries.appointments[0].startDate).toEqual(
                startAt
            );
            expect(appointmentSeries.id).toHaveLength(24);
            expect(appointmentSeries.startAt).toEqual(startAt);
            expect(appointmentSeries.endAt).toEqual(endAt);
            expect(appointmentSeries.provider.id).toEqual(provider.id);
            expect(appointmentSeries.appointments[0].slotData).toHaveLength(5);
            expect(
                appointmentSeries.appointments[0].properties.vaccine
            ).toEqual("biontech");
            expect(appointmentSeries.appointments).toHaveLength(60);

            const result = await context.providerApi.publishAppointments(
                appointmentSeries.appointments,
                providerKeyPairs
            );

            expect(result).toHaveLength(60);
            expect(result).toEqual(appointmentSeries.appointments);

            expect(result[0].properties.seriesId).toEqual(
                appointmentSeries.appointments[0].properties.seriesId
            );
        });

        it("should retrieve specific series", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const startAt = dayjs()
                .utc()
                .add(1, "day")
                .hour(8)
                .minute(0)
                .second(0)
                .toDate();

            const endAt = dayjs()
                .utc()
                .add(1, "day")
                .hour(10)
                .minute(0)
                .second(0)
                .toDate();

            const appointmentSeries1 =
                context.providerApi.createAppointmentSeries(
                    startAt,
                    endAt,
                    5,
                    5,
                    "biontech",
                    provider,
                    providerKeyPairs
                );

            const resultPub1 = await context.providerApi.publishAppointments(
                appointmentSeries1.appointments,
                providerKeyPairs
            );

            expect(resultPub1).toHaveLength(24);

            const appointmentSeries2 =
                context.providerApi.createAppointmentSeries(
                    startAt,
                    endAt,
                    10,
                    5,
                    "moderna",
                    provider,
                    providerKeyPairs
                );

            const resultPub2 = await context.providerApi.publishAppointments(
                appointmentSeries2.appointments,
                providerKeyPairs
            );
            expect(resultPub2).toHaveLength(12);

            const resultFetch1 =
                await context.providerApi.getProviderAppointmentsByProperty(
                    "seriesId",
                    appointmentSeries1.id,
                    providerKeyPairs
                );

            expect(resultFetch1).toHaveLength(24);
            expect(resultFetch1[0].properties.seriesId).toEqual(
                appointmentSeries1.appointments[0].properties.seriesId
            );
            expect(resultFetch1[0].properties.vaccine).toEqual(
                appointmentSeries1.appointments[0].properties.vaccine
            );

            const resultFetch2 =
                await context.providerApi.getProviderAppointmentsByProperty(
                    "vaccine",
                    "moderna",
                    providerKeyPairs
                );

            expect(resultFetch2).toHaveLength(12);
            expect(resultFetch2[0].properties.seriesId).toEqual(
                appointmentSeries2.appointments[0].properties.seriesId
            );
            expect(resultFetch2[0].properties.vaccine).toEqual(
                appointmentSeries2.appointments[0].properties.vaccine
            );
        });
    });

    describe("Backup", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        it("should backup and restore", async () => {
            const { provider } = await context.createVerifiedProvider();

            const secret = context.providerApi.generateSecret();

            const providerBackup: ProviderBackup = {
                verifiedProvider: provider,
            };

            const result = await context.providerApi.backupData(
                providerBackup,
                secret
            );

            expect(result).toHaveProperty("data");

            const restore = await context.providerApi.restoreFromBackup(secret);

            expect(providerBackup).toEqual(restore);
        });
    });
});
