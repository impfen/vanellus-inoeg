import { AnonymousApi, ProviderApi } from ".";
import {
    createVerifiedProvider,
    getAdminApi,
    getAnonymousApi,
    getMediatorApi,
    getProviderApi,
} from "../../tests/test-utils";
import { Provider } from "../interfaces";
import { dayjs } from "../utils";
import { AdminKeyPairs, ProviderKeyPairs } from "./interfaces";

let adminKeyPairs: AdminKeyPairs;
let providerKeyPairs: ProviderKeyPairs;
let providerApi: ProviderApi;
let provider: Provider;
let anonymousApi: AnonymousApi;

beforeEach(async () => {
    const adminResult = await getAdminApi();

    // we reset the database
    await adminResult.adminApi.resetAppointmentsDb(adminResult.adminKeyPairs);

    adminKeyPairs = adminResult.adminKeyPairs;

    const providerResult = await getProviderApi();

    providerKeyPairs = providerResult.providerKeyPairs;
    providerApi = providerResult.providerApi;

    anonymousApi = getAnonymousApi();

    const { mediatorKeyPairs } = await getMediatorApi({
        adminKeyPairs,
    });

    provider = await createVerifiedProvider(providerKeyPairs, mediatorKeyPairs);
});

describe("AnonymousApi", () => {
    it("should be able to get appointments", async function () {
        // tomorrow 3 pm
        const date = dayjs()
            .utc()
            .add(1, "day")
            .hour(15)
            .minute(0)
            .second(0)
            .toDate();

        const unpublishedAppointment = providerApi.createAppointment(
            15,
            "moderna",
            5,
            date,
            provider,
            providerKeyPairs
        );

        const isSuccess = await providerApi.publishAppointments(
            [unpublishedAppointment],
            providerKeyPairs
        );

        expect(isSuccess).toBeTruthy();

        const from = dayjs().utc().toDate();
        const to = dayjs().utc().add(1, "days").toDate();

        const providerAppointments =
            await anonymousApi.getAppointmentsByZipCode("10707", 10, from, to);

        expect(providerAppointments).toHaveLength(1);

        const appointment = await anonymousApi.getAppointment(
            providerAppointments[0].id,
            providerAppointments[0].provider.id
        );

        expect(appointment.id).toEqual(unpublishedAppointment.id);
    });

    it("should create and authenticate a provider and work with appointments", async function () {
        //create providers
        const providerData = {
            name: "Max Mustermann",
            street: "Musterstr. 23",
            city: "Berlin",
            zipCode: "10115",
            description: "",
            email: "max@mustermann.de",
            accessible: true,
        };

        const k1 = await providerApi.generateKeyPairs();
        const p1 = await providerApi.storeProvider(providerData, k1);

        expect(p1).toHaveProperty("name");

        providerData.zipCode = "60312";
        const k2 = await providerApi.generateKeyPairs();
        const p2 = await providerApi.storeProvider(providerData, k2);

        expect(p2).toHaveProperty("name");

        providerData.zipCode = "65936";
        const k3 = await providerApi.generateKeyPairs();
        const p3 = await providerApi.storeProvider(providerData, k3);

        expect(p3).toHaveProperty("name");

        providerData.zipCode = "96050";
        const k4 = await providerApi.generateKeyPairs();
        const p4 = await providerApi.storeProvider(providerData, k4);

        expect(p4).toHaveProperty("name");

        // query providers
        const noProviders = await anonymousApi.getProvidersByZipCode(
            "60000",
            "69999"
        );

        expect(noProviders).toHaveLength(0);

        // disabled until id is added to getPendingProviders
        // // confirm providers
        // const pendingProviders = await mediatorApi.getPendingProviders(
        //     mediatorKeyPairs
        // );

        // for (const pendingProvider of pendingProviders) {
        //     const confirmResult = await mediatorApi.confirmProvider(
        //         pendingProvider,
        //         mediatorKeyPairs
        //     );

        //     expect(confirmResult).toHaveProperty("name");
        // }

        // // query providers
        // const providers = await anonymousApi.getProvidersByZipCode(
        //     "60000",
        //     "69999"
        // );

        // expect(providers).toHaveLength(2);
        // expect(providers.map((provider) => provider.zipCode).sort()).toEqual([
        //     "60312",
        //     "65936",
        // ]);
    });

    it("we should be able to get the public keys anonymously", async function () {
        const publicKeys = await anonymousApi.getKeys();

        expect(publicKeys.rootKey).toEqual(adminKeyPairs.signing.publicKey);
        expect(publicKeys.tokenKey).toEqual(adminKeyPairs.token.publicKey);
        expect(publicKeys.providerData).toEqual(
            adminKeyPairs.provider.publicKey
        );
    });
});
