import { TestContext } from "../../tests/TestContext";
import { dayjs } from "../utils";
import { BookingStatus, UserBackup } from "./interfaces";

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

            console.log(userQueueToken);

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
    });

    describe("Appointments", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        const from = dayjs().utc().toDate();

        // 24 hours in the future
        const to = dayjs().utc().add(1, "days").toDate();

        it("should create an appointment", async () => {
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
            expect(appointments[0].startDate).toEqual(appointment.startDate);
            expect(appointments[0].slotData).toHaveLength(10);
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
            expect(booking.code).toEqual(userSecret.slice(0, 4));
            expect(booking.appointmentId).toEqual(appointment.id);
            expect(booking.providerId).toEqual(provider.id);

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
            expect(booking.code).toEqual(userSecret.slice(0, 4));
            expect(booking.appointmentId).toEqual(appointment.id);
            expect(booking.providerId).toEqual(provider.id);

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
            expect(booking.code).toEqual(userSecret.slice(0, 4));
            expect(booking.appointmentId).toEqual(appointment.id);
            expect(booking.providerId).toEqual(provider.id);

            const appointments =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            expect(appointments[0].bookings[0].code).toEqual(
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
            expect(booking.code).toEqual(userSecret.slice(0, 4));
            expect(booking.appointmentId).toEqual(appointment.id);
            expect(booking.providerId).toEqual(provider.id);

            const cancelResult = await context.userApi.cancelBooking(
                appointment,
                userQueueToken
            );

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

            expect(appointment.slotData).toHaveLength(10);

            const booking = await context.userApi.bookAppointment(
                appointment,
                userQueueToken
            );

            expect(booking.slotId).toBeDefined();
            expect(booking.code).toEqual(userSecret.slice(0, 4));
            expect(booking.appointmentId).toEqual(appointment.id);
            expect(booking.providerId).toEqual(provider.id);

            const bookedAppointment = await context.anonymousApi.getAppointment(
                appointment.id,
                appointment.provider.id
            );

            expect(bookedAppointment.slotData[0].open).toEqual(false);

            const cancelResult = await context.userApi.cancelBooking(
                appointment,
                userQueueToken
            );

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

            expect(canceledAppointment.slotData[0].open).toEqual(true);
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
            expect(booking.code).toEqual(userSecret.slice(0, 4));
            expect(booking.appointmentId).toEqual(appointment.id);
            expect(booking.providerId).toEqual(provider.id);

            const cancelResult = await context.providerApi.cancelAppointment(
                appointment,
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
                acceptedAppointments: [],
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
