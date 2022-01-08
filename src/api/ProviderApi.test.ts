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
import { MediatorKeyPairs, ProviderKeyPairs } from "./interfaces";
import { ProviderApi } from "./ProviderApi";

let mediatorApi: MediatorApi;
let mediatorKeyPairs: MediatorKeyPairs;
let providerApi: ProviderApi;
let providerKeyPairs: ProviderKeyPairs;
let anonymousApi: AnonymousApi;

beforeAll(async () => {
    const { adminApi, adminKeyPairs } = await getAdminApi();

    await adminApi.resetAppointmentsDb(adminKeyPairs);

    const providerResult = await getProviderApi();

    providerApi = providerResult.providerApi;
    providerKeyPairs = providerResult.providerKeyPairs;

    const mediatorResult = await getMediatorApi({ adminKeyPairs });

    anonymousApi = getAnonymousApi();

    mediatorApi = mediatorResult.mediatorApi;
    mediatorKeyPairs = mediatorResult.mediatorKeyPairs;

    await createVerifiedProvider(providerKeyPairs, mediatorKeyPairs);
});

describe("ProviderApi", () => {
    it("should be able to cancel appointments", async () => {
        // tomorrow 3 pm
        const date = dayjs()
            .utc()
            .add(1, "day")
            .hour(15)
            .minute(0)
            .second(0)
            .toDate();

        const app = providerApi.createAppointment(15, "moderna", 5, date);

        const publishResult = await providerApi.publishAppointments(
            [app],
            providerKeyPairs
        );

        expect(publishResult).toHaveLength(1);

        const from = dayjs().utc().toDate();
        const to = dayjs().utc().add(1, "day").toDate();

        const appointments1 = await providerApi.getAppointments(
            from,
            to,
            providerKeyPairs
        );

        expect(appointments1).toHaveLength(1);

        const appointments2 = await providerApi.getAppointments(
            from,
            to,
            providerKeyPairs
        );

        expect(appointments2).toHaveLength(1);

        if (publishResult?.[0]) {
            await providerApi.cancelAppointment(
                publishResult[0],
                providerKeyPairs
            );
        }

        const appointments3 = await anonymousApi.getAppointmentsByZipCode(
            "10707",
            10,
            from,
            to
        );

        expect(appointments3).toHaveLength(0);
    });

    it("should be able to retrieve confirmed provider data", async function () {
        const k = await providerApi.generateKeyPairs();
        await createUnverifiedProvider(k);
        const result = await providerApi.checkData(k);

        expect(result).toBeNull();

        const providerDatas = await mediatorApi.getPendingProviders(
            mediatorKeyPairs
        );

        expect(providerDatas).toHaveLength(1);

        const result2 = await mediatorApi.confirmProvider(
            providerDatas[0],
            mediatorKeyPairs
        );

        expect(result2).toHaveProperty("name");

        const result3 = await providerApi.checkData(k);

        expect(result3).toHaveProperty("name");
    });

    it("should be able to get provider appointments", async function () {
        const from = dayjs().utc().toDate();
        const to = dayjs().utc().add(1, "day").toDate();

        const appointments = await providerApi.getAppointments(
            from,
            to,
            providerKeyPairs
        );

        expect(appointments).toHaveLength(1);
    });
});
