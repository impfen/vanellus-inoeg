// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import {
    createUnverifiedProvider,
    getAdminApi,
    getMediatorApi,
    getProviderApi,
} from "../../tests/test-utils";
import { MediatorKeyPairs, Provider } from "./interfaces";
import { MediatorApi } from "./MediatorApi";

let mediatorApi: MediatorApi;
let mediatorKeyPairs: MediatorKeyPairs;

beforeAll(async () => {
    const { adminApi, adminKeyPairs } = await getAdminApi();

    await adminApi.resetAppointmentsDb(adminKeyPairs);

    const mediatorResult = await getMediatorApi({ adminKeyPairs });

    mediatorApi = mediatorResult.mediatorApi;
    mediatorKeyPairs = mediatorResult.mediatorKeyPairs;
});

describe("MediatorService", () => {
    describe("confirm a provider", () => {
        let providerData: Provider;

        it("should create unverified provider", async () => {
            const { providerKeyPairs } = await getProviderApi();

            providerData = await createUnverifiedProvider(providerKeyPairs);
        });

        it("should get pending provider", async () => {
            expect(providerData).toHaveProperty("id");

            const pendingProviders = await mediatorApi.getPendingProviders(
                mediatorKeyPairs
            );

            expect(pendingProviders).toHaveLength(1);
            expect(pendingProviders[0].name).toEqual(providerData.name);
        });

        it("should confirm provider", async () => {
            const confirmedProvider = await mediatorApi.confirmProvider(
                providerData,
                mediatorKeyPairs
            );

            expect(confirmedProvider).toHaveProperty("name");
        });

        it("should not fetch pending providers after confirmation", async () => {
            const pendingProviders = await mediatorApi.getPendingProviders(
                mediatorKeyPairs
            );

            expect(pendingProviders).toHaveLength(0);
        });

        it("should get verified providers", async () => {
            const verifiedProviders = await mediatorApi.getVerifiedProviders(
                mediatorKeyPairs
            );

            expect(verifiedProviders).toHaveLength(1);
        });
    });
});
