import { AnonymousApi, MediatorApi, ProviderApi } from ".";
import {
    createVerifiedProvider,
    getAdminApi,
    getAnonymousApi,
    getMediatorApi,
    getProviderApi,
} from "../../tests/test-utils";
import { dayjs } from "../utils";
import {
    AdminKeyPairs,
    MediatorKeyPairs,
    Provider,
    ProviderKeyPairs,
} from "./interfaces";

let adminKeyPairs: AdminKeyPairs;
let providerKeyPairs: ProviderKeyPairs;
let providerApi: ProviderApi;
let provider: Provider;
let mediatorApi: MediatorApi;
let mediatorKeyPairs: MediatorKeyPairs;
let anonymousApi: AnonymousApi;

beforeEach(async () => {
    const adminResult = await getAdminApi();

    // we reset the database
    await adminResult.adminApi.resetDb(adminResult.adminKeyPairs);

    adminKeyPairs = adminResult.adminKeyPairs;

    anonymousApi = getAnonymousApi();

    const providerResult = await getProviderApi();

    providerKeyPairs = providerResult.providerKeyPairs;
    providerApi = providerResult.providerApi;

    const mediatorResult = await getMediatorApi({ adminKeyPairs });

    mediatorApi = mediatorResult.mediatorApi;
    mediatorKeyPairs = mediatorResult.mediatorKeyPairs;

    provider = await createVerifiedProvider(providerKeyPairs, mediatorKeyPairs);
});

describe("AnonymousApi", () => {
    it("should get appointments", async () => {
        // tomorrow 3 pm
        const date = dayjs()
            .utc()
            .add(1, "day")
            .hour(15)
            .minute(0)
            .second(0)
            .toDate();

        const unpublishedAppointment = providerApi.createAppointment(
            date,
            15,
            "moderna",
            5,
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

        const providerAppointments = await anonymousApi.getAppointments(
            "10707",
            from,
            to,
            10
        );

        expect(providerAppointments).toHaveLength(1);

        const aggregatedAppointments =
            await anonymousApi.getAggregatedAppointments("10707", from, to, 10);

        expect(aggregatedAppointments).toHaveLength(1);

        const appointment = await anonymousApi.getAppointment(
            providerAppointments[0].id,
            providerAppointments[0].provider.id
        );

        expect(appointment.id).toEqual(unpublishedAppointment.id);
    });

    it("should create and verify a provider and work with appointments", async () => {
        //create providers
        const providerData = {
            name: "Max Mustermann",
            street: "Musterstr. 23",
            city: "Berlin",
            zipCode: "10115",
            description: "This is a description",
            email: "max@mustermann.de",
            accessible: true,
        };

        const k1 = await providerApi.generateKeyPairs();
        const p1 = await providerApi.storeProvider(providerData, k1);

        expect(p1).toHaveProperty("id");
        expect(p1.name).toEqual(providerData.name);
        expect(p1.street).toEqual(providerData.street);
        expect(p1.city).toEqual(providerData.city);
        expect(p1.zipCode).toEqual(providerData.zipCode);
        expect(p1.description).toEqual(providerData.description);
        expect(p1.email).toEqual(providerData.email);
        expect(p1.accessible).toEqual(providerData.accessible);

        providerData.zipCode = "60312";
        const k2 = await providerApi.generateKeyPairs();
        const p2 = await providerApi.storeProvider(providerData, k2);

        expect(p2).toHaveProperty("id");
        expect(p2.zipCode).toEqual(providerData.zipCode);

        providerData.zipCode = "65936";
        const k3 = await providerApi.generateKeyPairs();
        const p3 = await providerApi.storeProvider(providerData, k3);

        expect(p3).toHaveProperty("id");
        expect(p3.zipCode).toEqual(providerData.zipCode);

        providerData.zipCode = "96050";
        const k4 = await providerApi.generateKeyPairs();
        const p4 = await providerApi.storeProvider(providerData, k4);

        expect(p4).toHaveProperty("id");
        expect(p4.zipCode).toEqual(providerData.zipCode);

        // query providers
        const noProviders = await anonymousApi.getProviders("60000", "69999");

        expect(noProviders).toHaveLength(0);

        // verify providers
        const unverifiedProviders = await mediatorApi.getPendingProviders(
            mediatorKeyPairs
        );

        for (const unverifiedProvider of unverifiedProviders) {
            const verifiedResult = await mediatorApi.confirmProvider(
                unverifiedProvider,
                mediatorKeyPairs
            );

            expect(verifiedResult).toEqual(unverifiedProvider);
        }

        // query providers
        const providers = await anonymousApi.getProviders("60000", "69999");

        expect(providers).toHaveLength(2);
        expect(providers.map((provider) => provider.zipCode).sort()).toEqual([
            "60312",
            "65936",
        ]);
    });

    it("should get the public keys anonymously", async () => {
        const publicKeys = await anonymousApi.getKeys();

        expect(publicKeys.rootKey).toEqual(adminKeyPairs.signing.publicKey);
        expect(publicKeys.tokenKey).toEqual(adminKeyPairs.token.publicKey);
        expect(publicKeys.providerData).toEqual(
            adminKeyPairs.provider.publicKey
        );
    });

    it("should get the configurables", async () => {
        const configurables = await anonymousApi.getConfigurables();

        expect(configurables).toHaveProperty("vaccines");
        expect(configurables).toHaveProperty("anon_max_time_window");
        expect(configurables).toHaveProperty("anon_aggregated_max_time_window");
        expect(configurables).toHaveProperty("provider_max_time_window");
    });
});
