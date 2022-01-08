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
    ProviderData,
    ProviderKeyPairs,
    QueueToken,
    UnpublishedAppointment,
} from "./interfaces";
import { UserApi } from "./UserApi";

let userApi: UserApi;
let secret: string;
let anonApi: AnonymousApi;
let providerApi: ProviderApi;
let providerKeyPairs: ProviderKeyPairs;
let provider: ProviderData;

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
    let unpublishedAppointment: UnpublishedAppointment;
    let appointment: Appointment;
    let queueToken: QueueToken;
    const from = dayjs().utc().toDate();

    // 24 hours in the future
    const to = dayjs().utc().add(2, "days").toDate();

    it("should be able to create an appointment", () => {
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

    it("should be able to publish an appointment", async () => {
        const appointments = await providerApi.publishAppointments(
            [unpublishedAppointment],
            providerKeyPairs
        );

        expect(appointments).toHaveLength(1);

        if (appointments?.[0]) {
            appointment = appointments[0];
        }
    });

    it("should be able to get a user-token", async () => {
        queueToken = await userApi.getQueueToken({}, secret);
    });

    it("should be able to fetch the published appointment", async () => {
        const appointments1 = await anonApi.getAppointmentsByZipCode(
            "10707",
            10,
            from,
            to
        );

        expect(appointments1).toHaveLength(1);
    });

    it("should be able to book an appointment", async () => {
        const booking = await userApi.bookAppointment(
            appointment,
            provider,
            queueToken
        );

        expect(booking).toHaveProperty("token");
    });

    it("should have the saved the booking in the appointment", async () => {
        const providerAppointments = await providerApi.getAppointments(
            from,
            to,
            providerKeyPairs
        );

        expect(
            providerAppointments[0].bookings?.[0].data?.userToken.code
        ).toEqual(secret.slice(0, 4));
    });

    it("should be able to cancel the booking", async () => {
        const cancelResult = await userApi.cancelAppointment(
            appointment,
            provider,
            queueToken
        );

        expect(cancelResult).toBeTruthy();
    });

    it("should be no bookings after cancelation", async () => {
        const appointments = await providerApi.getAppointments(
            from,
            to,
            providerKeyPairs
        );

        expect(appointments[0].bookings).toHaveLength(0);
    });

    it("should be able to get a token", async function () {
        const queueToken = await userApi.getQueueToken({}, secret);

        expect(queueToken.userToken.version).toEqual("0.3");
    });
});
