// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import dayjs from "dayjs";
import { NotFoundError } from "../errors";
import { AppointmentStatus, ProviderStatus } from "../interfaces";
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

        const from = dayjs.utc();
        const to = dayjs.utc().add(1, "day");

        it("should create new provider", async () => {
            const providerKeyPairs =
                await context.providerApi.generateKeyPairs();

            const provider = await context.providerApi.createProvider(
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

            const verifiedProvider = await context.providerApi.checkProvider(
                providerKeyPairs
            );

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
            const { provider, providerKeyPairs } =
                await context.createUnverifiedProvider();

            expect(
                await context.providerApi.checkStatus(providerKeyPairs)
            ).toEqual(ProviderStatus.UNVERIFIED);

            const verifiedProvider = await context.mediatorApi.confirmProvider(
                provider,
                context.mediatorKeyPairs
            );

            expect(verifiedProvider).toEqual(provider);

            expect(
                await context.providerApi.checkStatus(providerKeyPairs)
            ).toEqual(ProviderStatus.VERIFIED_FIRST);

            expect(
                await context.providerApi.checkStatus(providerKeyPairs)
            ).toEqual(ProviderStatus.VERIFIED);
        });

        it("should get data for verified provider", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const verifiedProvider = await context.providerApi.checkProvider(
                providerKeyPairs
            );

            expect(provider).toEqual(verifiedProvider);
        });

        it("should update verified provider", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            await context.providerApi.updateProvider(
                {
                    ...provider,
                    name: "New Name",
                },
                providerKeyPairs
            );

            expect(
                await context.providerApi.checkStatus(providerKeyPairs)
            ).toEqual(ProviderStatus.CHANGED);

            const verifiedProvider = await context.providerApi.checkProvider(
                providerKeyPairs
            );

            expect(verifiedProvider).toEqual(provider);

            expect(verifiedProvider?.id).toEqual(provider.id);

            const pendingProviders =
                await context.mediatorApi.getPendingProviders(
                    context.mediatorKeyPairs
                );

            expect(pendingProviders[0]?.id).toEqual(provider.id);
            expect(pendingProviders[0]?.name).toEqual("New Name");
            expect(pendingProviders[0]?.createdAt).toEqual(provider.createdAt);
            expect(
                pendingProviders[0]?.updatedAt > provider.updatedAt
            ).toBeTruthy();

            await context.mediatorApi.confirmProvider(
                provider,
                context.mediatorKeyPairs
            );

            expect(
                await context.providerApi.checkStatus(providerKeyPairs)
            ).toEqual(ProviderStatus.VERIFIED);
        });

        it("should update provider with resilience", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            await context.providerApi.updateProvider(
                {
                    ...provider,
                    website: undefined,
                },
                providerKeyPairs
            );

            const verifiedProvider = await context.providerApi.checkProvider(
                providerKeyPairs
            );

            expect(verifiedProvider).toEqual(provider);

            expect(verifiedProvider?.id).toEqual(provider.id);

            const pendingProviders =
                await context.mediatorApi.getPendingProviders(
                    context.mediatorKeyPairs
                );

            expect(pendingProviders[0]?.id).toEqual(provider.id);
            expect(pendingProviders[0]?.website).toEqual("");
        });

        it("should update unverified provider", async () => {
            const { provider, providerKeyPairs } =
                await context.createUnverifiedProvider();

            await context.providerApi.updateProvider(
                {
                    ...provider,
                    name: "foobar",
                },
                providerKeyPairs
            );

            const verifiedProvider = await context.providerApi.checkProvider(
                providerKeyPairs
            );

            expect(verifiedProvider).toBeNull();
        });

        it("should validate provider", async () => {
            const unverifiedProvider = await context.createUnverifiedProvider();

            expect(
                await context.providerApi.isValidKeyPairs(
                    unverifiedProvider.providerKeyPairs
                )
            ).toEqual(true);

            expect(
                await context.providerApi.isValidatedKeyPairs(
                    unverifiedProvider.providerKeyPairs
                )
            ).toEqual(false);

            const verifiedProvider = await context.createVerifiedProvider();

            expect(
                await context.providerApi.isValidKeyPairs(
                    verifiedProvider.providerKeyPairs
                )
            ).toEqual(true);

            expect(
                await context.providerApi.isValidatedKeyPairs(
                    verifiedProvider.providerKeyPairs
                )
            ).toEqual(true);
        });
    });

    describe("Appointments", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        const from = dayjs.utc();
        const to = dayjs.utc().add(1, "day");

        it("should create appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            // tomorrow 3 pm
            const date = dayjs.utc().add(1, "day").hour(15).minute(0).second(0);
            const appointment = context.providerApi.createAppointment(
                date,
                15,
                "moderna",
                5,
                provider,
                providerKeyPairs
            );

            expect(appointment).toHaveProperty("id");
            expect(appointment.startAt).toEqual(date);
            expect(appointment.startAt.isUTC()).toBeTruthy();
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

            const initialAppointments =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            await context.userApi.bookAppointment(appointment, userQueueToken);

            appointment.slotData = [appointment.slotData[1]];

            appointment.duration = 31;
            appointment.vaccine = "moderna";

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
            expect(appointments[0].updatedAt).not.toEqual(
                initialAppointments[0].updatedAt
            );
            expect(appointments[0].id).toEqual(initialAppointments[0].id);
        });

        it("should have correct appointment-status", async () => {
            const { userQueueToken } = await context.createUserQueueToken();

            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const providerAppointments =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            expect(providerAppointments[0].status).toEqual(
                AppointmentStatus.OPEN
            );

            await context.userApi.bookAppointment(appointment, userQueueToken);

            const providerAppointments2 =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            expect(providerAppointments2[0].status).toEqual(
                AppointmentStatus.BOOKINGS
            );

            const { userQueueToken: userQueueToken2 } =
                await context.createUserQueueToken();

            await context.userApi.bookAppointment(appointment, userQueueToken2);

            const providerAppointments3 =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            expect(providerAppointments3[0].status).toEqual(
                AppointmentStatus.FULL
            );

            await context.providerApi.cancelAppointment(
                providerAppointments[0],
                providerKeyPairs
            );

            const providerAppointments4 =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            expect(providerAppointments4[0].status).toEqual(
                AppointmentStatus.CANCELED
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

        it("should retrieve the correct number of appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const startAt = dayjs.utc().add(1, "day").hour(10);
            const endAt = dayjs.utc().add(1, "day").hour(20);

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

            await context.providerApi.publishAppointments(
                appointmentSeries.appointments,
                providerKeyPairs
            );

            const appointments =
                await context.providerApi.getProviderAppointments(
                    startAt,
                    endAt,
                    providerKeyPairs
                );

            expect(appointments.length).toEqual(
                appointmentSeries.appointments.length
            );
        });

        it("should cancel appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const appointments =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            const result = await context.providerApi.cancelAppointment(
                appointments[0],
                providerKeyPairs
            );

            expect(result.slotData).toHaveLength(0);
        });

        it("should not retrieve canceled appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const providerAppointments =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            await context.providerApi.cancelAppointment(
                providerAppointments[0],
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

            const startAt = dayjs
                .utc()
                .add(1, "day")
                .hour(10)
                .minute(0)
                .second(0);
            const endAt = dayjs
                .utc()
                .add(1, "day")
                .hour(15)
                .minute(0)
                .second(0);

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

            expect(appointmentSeries.appointments[0].startAt).toEqual(startAt);
            expect(
                appointmentSeries.appointments[0].startAt.isUTC()
            ).toBeTruthy();
            expect(appointmentSeries.id).toHaveLength(24);
            expect(appointmentSeries.startAt).toEqual(startAt);
            expect(appointmentSeries.endAt).toEqual(endAt);
            expect(appointmentSeries.provider.id).toEqual(provider.id);
            expect(appointmentSeries.appointments[0].slotData).toHaveLength(5);
            expect(appointmentSeries.appointments[0].vaccine).toEqual(
                "biontech"
            );
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

            const startAt = dayjs
                .utc()
                .add(1, "day")
                .hour(8)
                .minute(0)
                .second(0);
            const endAt = dayjs
                .utc()
                .add(1, "day")
                .hour(10)
                .minute(0)
                .second(0);

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

            const resultFetch1 = await context.providerApi.getAppointmentSeries(
                appointmentSeries1.id,
                providerKeyPairs
            );

            expect(resultFetch1.appointments).toHaveLength(24);
            expect(resultFetch1.id).toEqual(
                appointmentSeries1.appointments[0].properties.seriesId
            );
            expect(resultFetch1.appointments[0].vaccine).toEqual(
                appointmentSeries1.appointments[0].vaccine
            );

            const resultFetch2 =
                await context.providerApi.getProviderAppointmentsByProperty(
                    "seriesId",
                    appointmentSeries2.id,
                    providerKeyPairs
                );

            expect(resultFetch2).toHaveLength(12);
            expect(resultFetch2[0].properties.seriesId).toEqual(
                appointmentSeries2.appointments[0].properties.seriesId
            );
            expect(resultFetch2[0].vaccine).toEqual(
                appointmentSeries2.appointments[0].vaccine
            );
        });

        it("should throw on unknown series", async () => {
            const { providerKeyPairs } = await context.createVerifiedProvider();

            const shouldThrow = context.providerApi.getAppointmentSeries(
                "non-existant",
                providerKeyPairs
            );

            await expect(shouldThrow).rejects.toThrowError(NotFoundError);
        });

        it("should cancel a specific series", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const startAt = dayjs
                .utc()
                .add(1, "day")
                .hour(8)
                .minute(0)
                .second(0);
            const endAt = dayjs
                .utc()
                .add(1, "day")
                .hour(10)
                .minute(0)
                .second(0);

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

            const canceledSeries =
                await context.providerApi.cancelAppointmentSeries(
                    appointmentSeries1.id,
                    providerKeyPairs
                );

            expect(canceledSeries?.appointments).toHaveLength(24);
            expect(canceledSeries?.appointments[0].status).toEqual(
                AppointmentStatus.CANCELED
            );
        });
    });

    describe("Backup", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        it("should backup and restore", async () => {
            const { provider, providerKeyPairs } =
                await context.createUnverifiedProvider();

            const secret = context.providerApi.generateSecret();

            const encryptedBackup = await context.providerApi.backupData(
                provider,
                providerKeyPairs,
                secret
            );

            expect(encryptedBackup).toHaveProperty("data");

            const restore = await context.providerApi.restoreFromBackup(
                encryptedBackup,
                secret
            );

            expect(restore.publicProvider).toEqual(provider);
            expect(restore.providerKeyPairs).toEqual(providerKeyPairs);
        });
    });
});
