import { TestContext } from "../../tests/TestContext";
import { dayjs } from "../utils";

describe("AnonymousApi", () => {
    describe("Keys", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        it("should get public keys of the system", async () => {
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

        it("should get configurables", async () => {
            const configurables = await context.anonymousApi.getConfigurables();

            expect(configurables).toHaveProperty("vaccines");
            expect(configurables).toHaveProperty("anon_max_time_window");
            expect(configurables).toHaveProperty(
                "anon_aggregated_max_time_window"
            );
            expect(configurables).toHaveProperty("provider_max_time_window");
        });
    });

    describe("Appointments", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        const from = dayjs().utc().toDate();
        const to = dayjs().utc().add(1, "days").toDate();

        it("should get single appointment", async () => {
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

            const appointment = await context.createConfirmedAppointment({
                providerKeyPairs,
                provider,
            });

            const appointments = await context.anonymousApi.getAppointments(
                context.defaultProviderData.zipCode,
                from,
                to
            );

            expect(appointments).toHaveLength(1);
            expect(appointments[0].id).toEqual(appointment.id);
        });

        it("should get aggregated appointments", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                providerKeyPairs,
                provider,
            });

            const aggregatedAppointments =
                await context.anonymousApi.getAggregatedAppointments(
                    context.defaultProviderData.zipCode,
                    from,
                    to
                );

            expect(aggregatedAppointments).toHaveLength(1);
            expect(aggregatedAppointments[0].id).toEqual(appointment.id);
            expect(aggregatedAppointments[0]).not.toHaveProperty("slotData");
        });

        it("should optionally verify appointment", async () => {
            const { provider, providerKeyPairs } =
                await context.createVerifiedProvider();

            const appointment = await context.createConfirmedAppointment({
                provider,
                providerKeyPairs,
            });

            const verifiedAppointment = context.anonymousApi.getAppointment(
                appointment.id,
                appointment.provider.id,
                true
            );

            await expect(verifiedAppointment).resolves.not.toThrow();
        });
    });

    describe("Providers", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        it("shouldn't get unverified providers", async () => {
            await context.createUnverifiedProvider({
                zipCode: 60312,
            });

            const noProviders = await context.anonymousApi.getProviders(
                60000,
                69999
            );

            expect(noProviders).toHaveLength(0);
        });

        it("should get verified providers", async () => {
            const { provider } = await context.createVerifiedProvider({
                zipCode: 60312,
            });

            const providers = await context.anonymousApi.getProviders(
                60000,
                69999
            );

            expect(providers[0].id).toEqual(provider.id);
        });

        it("should get providers based on zip", async () => {
            const { provider: p1 } = await context.createVerifiedProvider();

            expect(p1.zipCode).toEqual(context.defaultProviderData.zipCode);

            const { provider: p2 } = await context.createVerifiedProvider({
                zipCode: 60312,
            });

            expect(p2.zipCode).toEqual(60312);

            const { provider: p3 } = await context.createVerifiedProvider({
                zipCode: 65936,
            });

            expect(p3.zipCode).toEqual(65936);

            const { provider: p4 } = await context.createVerifiedProvider({
                zipCode: 96050,
            });

            expect(p4.zipCode).toEqual(96050);

            const providers = await context.anonymousApi.getProviders(
                60000,
                69999
            );

            expect(providers).toHaveLength(2);

            expect(
                providers.map((provider) => provider.zipCode).sort()
            ).toEqual(["60312", "65936"]);
        });
    });
});
