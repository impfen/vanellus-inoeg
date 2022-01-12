import { TestContext } from "../../tests/TestContext";
import { dayjs } from "../utils";

let context: TestContext;

beforeEach(async () => {
    context = await TestContext.createContext();
});

describe("AnonymousApi", () => {
    it("should get appointments", async () => {
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

        const unpublishedAppointment = context.providerApi.createAppointment(
            date,
            15,
            "moderna",
            5,
            provider,
            providerKeyPairs
        );

        const isSuccess = await context.providerApi.publishAppointments(
            unpublishedAppointment,
            providerKeyPairs
        );

        expect(isSuccess).toBeTruthy();

        const from = dayjs().utc().toDate();
        const to = dayjs().utc().add(1, "days").toDate();

        const providerAppointments = await context.anonymousApi.getAppointments(
            "10707",
            from,
            to,
            10
        );

        expect(providerAppointments).toHaveLength(1);

        const aggregatedAppointments =
            await context.anonymousApi.getAggregatedAppointments(
                "10707",
                from,
                to,
                10
            );

        expect(aggregatedAppointments).toHaveLength(1);

        const appointment = await context.anonymousApi.getAppointment(
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

        const k1 = await context.providerApi.generateKeyPairs();
        const p1 = await context.providerApi.storeProvider(providerData, k1);

        expect(p1).toHaveProperty("id");
        expect(p1.name).toEqual(providerData.name);
        expect(p1.street).toEqual(providerData.street);
        expect(p1.city).toEqual(providerData.city);
        expect(p1.zipCode).toEqual(providerData.zipCode);
        expect(p1.description).toEqual(providerData.description);
        expect(p1.email).toEqual(providerData.email);
        expect(p1.accessible).toEqual(providerData.accessible);

        providerData.zipCode = "60312";
        const k2 = await context.providerApi.generateKeyPairs();
        const p2 = await context.providerApi.storeProvider(providerData, k2);

        expect(p2).toHaveProperty("id");
        expect(p2.zipCode).toEqual(providerData.zipCode);

        providerData.zipCode = "65936";
        const k3 = await context.providerApi.generateKeyPairs();
        const p3 = await context.providerApi.storeProvider(providerData, k3);

        expect(p3).toHaveProperty("id");
        expect(p3.zipCode).toEqual(providerData.zipCode);

        providerData.zipCode = "96050";
        const k4 = await context.providerApi.generateKeyPairs();
        const p4 = await context.providerApi.storeProvider(providerData, k4);

        expect(p4).toHaveProperty("id");
        expect(p4.zipCode).toEqual(providerData.zipCode);

        // query providers
        const noProviders = await context.anonymousApi.getProviders(
            "60000",
            "69999"
        );

        expect(noProviders).toHaveLength(0);

        // verify providers
        const unverifiedProviders =
            await context.mediatorApi.getPendingProviders(
                context.mediatorKeyPairs
            );

        for (const unverifiedProvider of unverifiedProviders) {
            const verifiedResult = await context.mediatorApi.confirmProvider(
                unverifiedProvider,
                context.mediatorKeyPairs
            );

            expect(verifiedResult).toEqual(unverifiedProvider);
        }

        // query providers
        const providers = await context.anonymousApi.getProviders(
            "60000",
            "69999"
        );

        expect(providers).toHaveLength(2);
        expect(providers.map((provider) => provider.zipCode).sort()).toEqual([
            "60312",
            "65936",
        ]);
    });

    it("should get the public keys anonymously", async () => {
        const publicKeys = await context.anonymousApi.getKeys();

        expect(publicKeys.rootKey).toEqual(
            context.adminKeyPairs.signing.publicKey
        );
        expect(publicKeys.tokenKey).toEqual(
            context.adminKeyPairs.token.publicKey
        );
        expect(publicKeys.providerData).toEqual(
            context.adminKeyPairs.provider.publicKey
        );
    });

    it("should get the configurables", async () => {
        const configurables = await context.anonymousApi.getConfigurables();

        expect(configurables).toHaveProperty("vaccines");
        expect(configurables).toHaveProperty("anon_max_time_window");
        expect(configurables).toHaveProperty("anon_aggregated_max_time_window");
        expect(configurables).toHaveProperty("provider_max_time_window");
    });
});
