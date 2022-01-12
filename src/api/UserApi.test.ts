import { TestContext } from "../../tests/TestContext";
import { dayjs } from "../utils";
import { UserBackup } from "./interfaces";

let context: TestContext;

beforeEach(async () => {
    context = await TestContext.createContext();
});

describe("UserApi", () => {
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

    it("should get a user-token", async () => {
        const userQueueToken = await context.userApi.getQueueToken(
            context.userSecret
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
            "10707",
            from,
            to,
            10
        );

        expect(appointments[0].id).toEqual(appointment.id);
        expect(appointments[0].startDate).toEqual(appointment.startDate);
        expect(appointments[0].slotData).toHaveLength(10);
    });

    it("should book an appointment", async () => {
        const { provider, providerKeyPairs } =
            await context.createVerifiedProvider();

        const appointment = await context.createConfirmedAppointment({
            provider,
            providerKeyPairs,
        });

        const userQueueToken = await context.userApi.getQueueToken(
            context.userSecret
        );

        const booking = await context.userApi.bookAppointment(
            appointment,
            userQueueToken
        );

        expect(booking).toHaveProperty("id");
        expect(booking?.code).toHaveLength(4);
    });

    it("should not double book an appointment", async () => {
        const { provider, providerKeyPairs } =
            await context.createVerifiedProvider();

        const appointment = await context.createConfirmedAppointment({
            provider,
            providerKeyPairs,
        });

        const userQueueToken = await context.userApi.getQueueToken(
            context.userSecret
        );

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
        const { provider, providerKeyPairs } =
            await context.createVerifiedProvider();

        const appointment = await context.createConfirmedAppointment({
            provider,
            providerKeyPairs,
        });

        const userQueueToken = await context.userApi.getQueueToken(
            context.userSecret
        );

        const booking = await context.userApi.bookAppointment(
            appointment,
            userQueueToken
        );

        const appointments = await context.providerApi.getProviderAppointments(
            from,
            to,
            providerKeyPairs
        );

        expect(appointments[0].bookings[0].code).toEqual(
            context.userSecret.slice(0, 4)
        );
    });

    it("should cancel the booking", async () => {
        const { provider, providerKeyPairs } =
            await context.createVerifiedProvider();

        const appointment = await context.createConfirmedAppointment({
            provider,
            providerKeyPairs,
        });

        const userQueueToken = await context.userApi.getQueueToken(
            context.userSecret
        );

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
        const { provider, providerKeyPairs } =
            await context.createVerifiedProvider();

        const appointment = await context.createConfirmedAppointment({
            provider,
            providerKeyPairs,
        });

        const userQueueToken = await context.userApi.getQueueToken(
            context.userSecret
        );

        const booking = await context.userApi.bookAppointment(
            appointment,
            userQueueToken
        );

        const cancelResult = await context.userApi.cancelBooking(
            appointment,
            userQueueToken
        );

        const appointments = await context.providerApi.getProviderAppointments(
            from,
            to,
            providerKeyPairs
        );

        expect(appointments[0].bookings).toHaveLength(0);
    });

    it("should get a token", async () => {
        const userQueueToken = await context.userApi.getQueueToken(
            context.userSecret
        );

        expect(userQueueToken.userToken.version).toEqual("0.3");
    });

    it("should backup and restore", async () => {
        const userQueueToken = await context.userApi.getQueueToken(
            context.userSecret
        );

        expect(userQueueToken.userToken.version).toEqual("0.3");

        const userBackup: UserBackup = {
            userQueueToken,
            acceptedAppointments: [],
        };

        const result = await context.userApi.backupData(
            userBackup,
            context.userSecret
        );

        expect(result).toHaveProperty("data");

        const restore = await context.userApi.restoreFromBackup(
            context.userSecret
        );

        expect(userBackup).toEqual(restore);
    });
});
