import { TestContext } from "../../tests/TestContext";
import { dayjs } from "../utils";

describe("AnonymousApi", () => {
    describe("Appointments", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        it("should get a single appointment", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const confirmedAppointment =
                await context.createConfirmedAppointment({
                    providerKeyPairs,
                    provider,
                });

            const appointment = await context.anonymousApi.getAppointment(
                confirmedAppointment.id,
                provider.id
            );

            expect(appointment.id).toEqual(confirmedAppointment.id);
        });

        it("should get appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const unpublishedAppointment = context.createUnpublishedAppointment(
                {
                    providerKeyPairs,
                    provider,
                }
            );

            const isSuccess = await context.providerApi.publishAppointments(
                unpublishedAppointment,
                providerKeyPairs
            );

            expect(isSuccess).toBeTruthy();

            const from = dayjs().utc().toDate();
            const to = dayjs().utc().add(1, "days").toDate();

            const providerAppointments =
                await context.anonymousApi.getAppointments(10707, from, to, 10);

            expect(providerAppointments).toHaveLength(1);

            const aggregatedAppointments =
                await context.anonymousApi.getAggregatedAppointments(
                    10707,
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
            const { provider: p1 } = await context.createUnverifiedProvider();

            expect(p1).toHaveProperty("id");

            const { provider: p2 } = await context.createUnverifiedProvider({
                zipCode: 60312,
            });

            expect(p2).toHaveProperty("id");
            expect(p2.zipCode).toEqual(60312);

            const { provider: p3 } = await context.createUnverifiedProvider({
                zipCode: 65936,
            });

            expect(p3).toHaveProperty("id");
            expect(p3.zipCode).toEqual(65936);

            const { provider: p4 } = await context.createUnverifiedProvider({
                zipCode: 96050,
            });

            expect(p4).toHaveProperty("id");
            expect(p4.zipCode).toEqual(96050);

            // query providers
            const noProviders = await context.anonymousApi.getProviders(
                60000,
                69999
            );

            expect(noProviders).toHaveLength(0);

            // verify providers
            const unverifiedProviders =
                await context.mediatorApi.getPendingProviders(
                    context.mediatorKeyPairs
                );

            for (const unverifiedProvider of unverifiedProviders) {
                const verifiedResult =
                    await context.mediatorApi.confirmProvider(
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
            expect(
                providers.map((provider) => provider.zipCode).sort()
            ).toEqual(["60312", "65936"]);
        });
    });

    describe("Keys", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
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
    });

    describe("Configurables", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });
        it("should get the configurables", async () => {
            const configurables = await context.anonymousApi.getConfigurables();

            expect(configurables).toHaveProperty("vaccines");
            expect(configurables).toHaveProperty("anon_max_time_window");
            expect(configurables).toHaveProperty(
                "anon_aggregated_max_time_window"
            );
            expect(configurables).toHaveProperty("provider_max_time_window");
        });
    });
});
