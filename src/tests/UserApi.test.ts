// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import dayjs from "dayjs";
import type { UserBackup } from "../interfaces";
import { BookingStatus } from "../interfaces";
import { TestContext } from "./TestContext";

describe("UserApi", () => {
    describe("Keys and secret", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        it("should generate secrets", () => {
            const secret = context.userApi.generateSecret();

            expect(secret).toHaveLength(16);
        });

        it("should generate key-pairs", async () => {
            const userKeyPairs = await context.userApi.generateKeyPairs();

            expect(userKeyPairs).toBeDefined();
            expect(userKeyPairs).toHaveProperty("signing");
            expect(userKeyPairs).toHaveProperty("encryption");
        });
    });

    describe("Tokens", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        it("should get a queue-token", async () => {
            const userSecret = context.userApi.generateSecret();

            expect(userSecret).toHaveLength(16);

            const userQueueToken = await context.userApi.getQueueToken(
                userSecret
            );

            expect(userQueueToken).toBeDefined();
        });

        it("should get mutliple queue-tokens from the same secret?", async () => {
            const userSecret = context.userApi.generateSecret();

            expect(userSecret).toHaveLength(16);

            const userQueueToken = await context.userApi.getQueueToken(
                userSecret
            );

            expect(userQueueToken).toBeDefined();

            const userQueueToken2 = await context.userApi.getQueueToken(
                userSecret
            );

            expect(userQueueToken2).toBeDefined();

            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const booking1 = await context.userApi.bookAppointment(
                appointment,
                userQueueToken
            );

            expect(booking1).toBeDefined();

            const booking2 = await context.userApi.bookAppointment(
                appointment,
                userQueueToken2
            );

            expect(booking2).toBeDefined();

            const bookedAppointment = await context.anonymousApi.getAppointment(
                appointment.id,
                appointment.provider.id
            );

            expect(bookedAppointment).toBeDefined();
        });

        it("should be able to validate against the backend", async () => {
            const userSecret = context.userApi.generateSecret();

            expect(userSecret).toHaveLength(16);

            const userQueueToken = await context.userApi.getQueueToken(
                userSecret
            );

            expect(userQueueToken).toBeDefined();

            const isValid = await context.userApi.isValidToken(userQueueToken);

            expect(isValid).toEqual(true);
        });
    });

    describe("Appointments", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        const from = dayjs.utc();
        const to = dayjs.utc().add(1, "days");

        it("should create an appointment", async () => {
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
            expect(appointment.startAt.isUTC()).toBeTruthy();
        });

        it("should publish an appointment", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = context.createUnpublishedAppointment({
                provider,
                providerKeyPairs,
            });

            const appointments = await context.providerApi.publishAppointments(
                [appointment],
                providerKeyPairs
            );

            expect(appointments).toHaveLength(1);
        });

        it("should fetch published appointment", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const appointments = await context.anonymousApi.getAppointments(
                context.defaultProviderData.zipCode,
                from,
                to,
                10
            );

            expect(appointments[0].id).toEqual(appointment.id);
            expect(appointments[0].startAt).toEqual(appointment.startAt);
            expect(appointments[0].startAt.isUTC()).toBeTruthy();
            expect(appointments[0].slotData).toHaveLength(2);
        });

        it("should book an appointment", async () => {
            const { userQueueToken, userSecret } =
                await context.createUserQueueToken();

            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const booking = await context.userApi.bookAppointment(
                appointment,
                userQueueToken
            );

            expect(booking).not.toBeNull();
            expect(booking.slotId).toBeDefined();
            expect(booking.token.code).toEqual(userSecret.slice(0, 4));
            expect(booking.appointment.id).toEqual(appointment.id);
            expect(booking.appointment.provider.id).toEqual(provider.id);

            const status = await context.userApi.checkBookingStatus(booking);

            expect(status).toEqual(BookingStatus.VALID);
        });

        it("should not double book an appointment", async () => {
            const { userQueueToken, userSecret } =
                await context.createUserQueueToken();

            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const booking = await context.userApi.bookAppointment(
                appointment,
                userQueueToken
            );

            expect(booking.slotId).toBeDefined();
            expect(booking.token.code).toEqual(userSecret.slice(0, 4));
            expect(booking.appointment.id).toEqual(appointment.id);
            expect(booking.appointment.provider.id).toEqual(provider.id);

            const doubleBooking = context.userApi.bookAppointment(
                appointment,
                userQueueToken
            );

            await expect(
                doubleBooking
            ).rejects.toThrowErrorMatchingInlineSnapshot(
                `"Double booking detected"`
            );
        });

        it("should save the booking into the appointment", async () => {
            const { userQueueToken, userSecret } =
                await context.createUserQueueToken();

            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const booking = await context.userApi.bookAppointment(
                appointment,
                userQueueToken
            );

            expect(booking.slotId).toBeDefined();
            expect(booking.token.code).toEqual(userSecret.slice(0, 4));
            expect(booking.appointment.id).toEqual(appointment.id);
            expect(booking.appointment.provider.id).toEqual(provider.id);

            const appointments =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            expect(appointments[0].bookings[0].token.code).toEqual(
                userSecret.slice(0, 4)
            );
        });

        it("should cancel the booking", async () => {
            const { userQueueToken, userSecret } =
                await context.createUserQueueToken();

            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const booking = await context.userApi.bookAppointment(
                appointment,
                userQueueToken
            );

            expect(booking.slotId).toBeDefined();
            expect(booking.token.code).toEqual(userSecret.slice(0, 4));
            expect(booking.appointment.id).toEqual(appointment.id);
            expect(booking.appointment.provider.id).toEqual(provider.id);

            const cancelResult = await context.userApi.cancelBooking(booking);

            expect(cancelResult).toBeTruthy();

            const bookingStatus = await context.userApi.checkBookingStatus(
                booking
            );

            expect(bookingStatus).toEqual(BookingStatus.USER_CANCELED);
        });

        it("should have no bookings after cancelation by the user", async () => {
            const { userQueueToken, userSecret } =
                await context.createUserQueueToken();

            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            expect(appointment.slotData).toHaveLength(2);

            const booking = await context.userApi.bookAppointment(
                appointment,
                userQueueToken
            );

            expect(booking.slotId).toBeDefined();
            expect(booking.token.code).toEqual(userSecret.slice(0, 4));
            expect(booking.appointment.id).toEqual(appointment.id);
            expect(booking.appointment.provider.id).toEqual(provider.id);

            const bookedAppointment = await context.anonymousApi.getAppointment(
                appointment.id,
                appointment.provider.id
            );

            expect(
                bookedAppointment.slotData.filter((s) => s.open).length
            ).toEqual(1);
            expect(
                bookedAppointment.slotData.filter((s) => !s.open).length
            ).toEqual(1);

            const cancelResult = await context.userApi.cancelBooking(booking);

            expect(cancelResult).toBeTruthy();

            const appointments =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            expect(appointments[0].bookings).toHaveLength(0);

            const canceledAppointment =
                await context.anonymousApi.getAppointment(
                    appointment.id,
                    appointment.provider.id
                );

            expect(
                canceledAppointment.slotData.filter((s) => s.open).length
            ).toEqual(2);
            expect(
                canceledAppointment.slotData.filter((s) => !s.open).length
            ).toEqual(0);
        });

        it("should have no bookings after cancelation by the provider", async () => {
            const { userQueueToken, userSecret } =
                await context.createUserQueueToken();

            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const booking = await context.userApi.bookAppointment(
                appointment,
                userQueueToken
            );

            expect(booking.slotId).toBeDefined();
            expect(booking.token.code).toEqual(userSecret.slice(0, 4));
            expect(booking.appointment.id).toEqual(appointment.id);
            expect(booking.appointment.provider.id).toEqual(provider.id);

            const providerAppointments =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            const cancelResult = await context.providerApi.cancelAppointment(
                providerAppointments[0],
                providerKeyPairs
            );

            expect(cancelResult.id).toEqual(appointment.id);

            const canceledAppointment =
                await context.anonymousApi.getAppointment(
                    appointment.id,
                    appointment.provider.id
                );

            expect(canceledAppointment.slotData).toHaveLength(0);

            const bookingStatus = await context.userApi.checkBookingStatus(
                booking
            );

            expect(bookingStatus).toEqual(BookingStatus.PROVIDER_CANCELED);
        });
    });

    describe("Backup", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        it("should backup and restore", async () => {
            const { userQueueToken, userSecret } =
                await context.createUserQueueToken();

            expect(userQueueToken.userToken.version).toEqual("0.3");

            const userBackup: UserBackup = {
                userQueueToken: userQueueToken,
                bookings: [],
            };

            const result = await context.userApi.backupData(
                userBackup,
                userSecret
            );

            expect(result).toHaveProperty("data");

            const restore = await context.userApi.restoreFromBackup(userSecret);

            expect(userBackup).toEqual(restore);
        });
    });
});
