import { AnonymousApi, ProviderApi } from ".";
import {
    createVerifiedProvider,
    getAdminApi,
    getAnonymousApi,
    getMediatorApi,
    getProviderApi,
    getUserApi,
} from "../../tests/test-utils";
import { dayjs } from "../utils";
import {
    Appointment,
    Provider,
    ProviderKeyPairs,
    QueueToken,
} from "./interfaces";
import { UserApi } from "./UserApi";

let userApi: UserApi;
let secret: string;
let anonApi: AnonymousApi;
let providerApi: ProviderApi;
let providerKeyPairs: ProviderKeyPairs;
let provider: Provider;

beforeAll(async () => {
    const { adminApi, adminKeyPairs } = await getAdminApi();

    await adminApi.resetAppointmentsDb(adminKeyPairs);

    anonApi = getAnonymousApi();

    const providerResult = await getProviderApi();

    providerKeyPairs = providerResult.providerKeyPairs;
    providerApi = providerResult.providerApi;

    const userResult = await getUserApi();

    secret = userResult.userSecret;

    userApi = userResult.userApi;

    const { mediatorKeyPairs } = await getMediatorApi({
        adminKeyPairs,
    });

    provider = await createVerifiedProvider(providerKeyPairs, mediatorKeyPairs);
});

describe("UserApi", () => {
    let appointment: Appointment;
    let queueToken: QueueToken;
    const from = dayjs().utc().toDate();

    // 24 hours in the future
    const to = dayjs().utc().add(2, "days").toDate();

    it("should create an appointment", () => {
        // tomorrow 3 pm
        const date = dayjs()
            .utc()
            .add(1, "day")
            .hour(15)
            .minute(0)
            .second(0)
            .toDate();

        appointment = providerApi.createAppointment(
            15,
            "moderna",
            5,
            date,
            provider,
            providerKeyPairs
        );
    });

    it("should publish an appointment", async () => {
        const appointments = await providerApi.publishAppointments(
            [appointment],
            providerKeyPairs
        );

        expect(appointments).toHaveLength(1);
    });

    it("should get a user-token", async () => {
        queueToken = await userApi.getQueueToken({}, secret);
    });

    it("should fetch the published appointment", async () => {
        const appointments1 = await anonApi.getAppointmentsByZipCode(
            "10707",
            10,
            from,
            to
        );

        expect(appointments1).toHaveLength(1);
    });

    it("should book an appointment", async () => {
        const booking = await userApi.bookAppointment(appointment, queueToken);

        expect(booking).toHaveProperty("token");
    });

    it("should save the booking into the appointment", async () => {
        const appointments = await providerApi.getProviderAppointments(
            from,
            to,
            providerKeyPairs
        );

        expect(appointments[0].bookings?.[0].userToken.code).toEqual(
            secret.slice(0, 4)
        );
    });

    it("should cancel the booking", async () => {
        const cancelResult = await userApi.cancelAppointment(
            appointment,
            queueToken
        );

        expect(cancelResult).toBeTruthy();
    });

    it("should have no bookings after cancelation", async () => {
        const appointments = await providerApi.getProviderAppointments(
            from,
            to,
            providerKeyPairs
        );

        expect(appointments[0].bookings).toHaveLength(0);
    });

    it("should get a token", async function () {
        const queueToken = await userApi.getQueueToken({}, secret);

        expect(queueToken.userToken.version).toEqual("0.3");
    });
});
