// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

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

            expect(verifiedProvider).toEqual({ ...provider, verified: true });
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

            expect(verifiedProvider).toEqual({ ...provider, verified: true });
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

            expect(verifiedProvider).toEqual({ ...provider, verified: true });
            expect(verifiedProviders).toEqual([verifiedProvider]);
        });

        it("should get single verified provider", async () => {
            const { provider: verifiedProvider } =
                await context.createVerifiedProvider();

            const provider = await context.mediatorApi.getProvider(
                verifiedProvider.id,
                context.mediatorKeyPairs
            );

            expect(provider).toEqual(verifiedProvider);
        });

        it("should get single unverified provider", async () => {
            const { provider: unverifiedProvider } =
                await context.createUnverifiedProvider();

            const provider = await context.mediatorApi.getProvider(
                unverifiedProvider.id,
                context.mediatorKeyPairs
            );

            expect(provider).toEqual(unverifiedProvider);
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
