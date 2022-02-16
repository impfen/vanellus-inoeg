// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ProviderStatus } from "..";
import { TestContext } from "./TestContext";

describe("MediatorService", () => {
    describe("Provider", () => {
        let context: TestContext;

        beforeEach(async () => {
            context = await TestContext.createContext();
        });

        it("should get pending provider", async () => {
            const { provider } = await context.createUnverifiedProvider();

            const pendingProviders =
                await context.mediatorApi.getPendingProviders(
                    context.mediatorKeyPairs
                );

            expect(pendingProviders).toEqual([provider]);
        });

        it("should verify provider", async () => {
            const { provider } = await context.createUnverifiedProvider();

            const verifiedProvider = await context.mediatorApi.confirmProvider(
                provider,
                context.mediatorKeyPairs
            );

            expect(verifiedProvider).toEqual(provider);
        });

        it("should not fetch pending providers after verification", async () => {
            const { provider } = await context.createUnverifiedProvider();

            const verifiedProvider = await context.mediatorApi.confirmProvider(
                provider,
                context.mediatorKeyPairs
            );

            const pendingProviders =
                await context.mediatorApi.getPendingProviders(
                    context.mediatorKeyPairs
                );

            expect(verifiedProvider).toEqual(provider);
            expect(pendingProviders).toEqual([]);
        });

        it("should get verified providers", async () => {
            const { provider } = await context.createUnverifiedProvider();

            const verifiedProvider = await context.mediatorApi.confirmProvider(
                provider,
                context.mediatorKeyPairs
            );

            const verifiedProviders =
                await context.mediatorApi.getVerifiedProviders(
                    context.mediatorKeyPairs
                );

            expect(verifiedProvider).toEqual(provider);
            expect(verifiedProviders).toEqual([verifiedProvider]);
        });

        it("should get single verified provider", async () => {
            const {
                provider: verifiedProvider,
                providerKeyPairs: verifiedProviderKeyPairs,
            } = await context.createVerifiedProvider();

            let provider = await context.mediatorApi.getProvider(
                verifiedProvider.id,
                context.mediatorKeyPairs
            );

            expect(provider.verifiedProvider).toEqual(verifiedProvider);
            expect(provider.unverifiedProvider).toEqual(verifiedProvider);
            expect(provider.status).toEqual(ProviderStatus.VERIFIED);

            await context.providerApi.updateProvider(
                {
                    ...verifiedProvider,
                    name: "New Name",
                },
                verifiedProviderKeyPairs
            );

            provider = await context.mediatorApi.getProvider(
                verifiedProvider.id,
                context.mediatorKeyPairs
            );

            expect(provider.verifiedProvider).toEqual(verifiedProvider);
            expect(provider.unverifiedProvider.name).toEqual("New Name");
            expect(provider.status).toEqual(ProviderStatus.CHANGED);
        });

        it("should get single unverified provider", async () => {
            const { provider: unverifiedProvider } =
                await context.createUnverifiedProvider();

            const provider = await context.mediatorApi.getProvider(
                unverifiedProvider.id,
                context.mediatorKeyPairs
            );

            expect(provider.unverifiedProvider).toEqual(unverifiedProvider);
            expect(provider.verifiedProvider).toEqual(undefined);
            expect(provider.status).toEqual(ProviderStatus.UNVERIFIED);
        });

        it("should get all providers", async () => {
            await context.createUnverifiedProvider();
            await context.createVerifiedProvider();

            const providers = await context.mediatorApi.getProviders(
                context.mediatorKeyPairs
            );

            expect(providers).toHaveLength(2);
            expect(
                providers.filter(
                    (p) => p.status == ProviderStatus.VERIFIED_FIRST
                )
            ).toHaveLength(1);
            expect(
                providers.filter((p) => p.status == ProviderStatus.UNVERIFIED)
            ).toHaveLength(1);

            // check that reading by mediator does not update the VERIFIED_FIRST
            // status
            const providers2 = await context.mediatorApi.getProviders(
                context.mediatorKeyPairs
            );

            expect(
                providers2.filter(
                    (p) => p.status == ProviderStatus.VERIFIED_FIRST
                )
            ).toHaveLength(1);
            expect(
                providers2.filter((p) => p.status == ProviderStatus.VERIFIED)
            ).toHaveLength(0);
        });

        it("should validate mediator", async () => {
            expect(
                await context.mediatorApi.isValidKeyPairs(
                    context.mediatorKeyPairs
                )
            ).toEqual(true);
        });
    });
});
