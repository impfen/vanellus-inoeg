import { TestContext } from "../../tests/TestContext";
import { dayjs } from "../utils";
import { UserBackup } from "./interfaces";

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

        it("should get a queue-token", async () => {
            const userSecret = context.userApi.generateSecret();

            expect(userSecret).toHaveLength(16);

            const userQueueToken = await context.userApi.getQueueToken(
                userSecret
            );

            expect(userQueueToken).toBeDefined();
        });

        it("should fetch published appointment", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const appointments = await context.anonymousApi.getAppointments(
                10707,
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

            expect(booking).toHaveProperty("id");
            expect(booking?.code).toHaveLength(4);
        });

        it("should not double book an appointment", async () => {
            const { userQueueToken } = await context.createUserQueueToken();

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

            const booking2 = await context.userApi.bookAppointment(
                appointment,
                userQueueToken
            );

            expect(booking2).toBeNull();
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

            const cancelResult = await context.userApi.cancelBooking(
                appointment,
                userQueueToken
            );

            expect(cancelResult).toBeTruthy();
        });

        it("should have no bookings after cancelation", async () => {
            const { userQueueToken } = await context.createUserQueueToken();

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

            const cancelResult = await context.userApi.cancelBooking(
                appointment,
                userQueueToken
            );

            const appointments =
                await context.providerApi.getProviderAppointments(
                    from,
                    to,
                    providerKeyPairs
                );

            expect(appointments[0].bookings).toHaveLength(0);
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
