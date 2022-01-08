// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import {
    createUnverifiedProvider,
    getAdminApi,
    getMediatorApi,
    getProviderApi,
} from "../../tests/test-utils";
import { MediatorKeyPairs, ProviderData } from "./interfaces";
import { MediatorApi } from "./MediatorApi";

let mediatorApi: MediatorApi;
let mediatorApiKeyPairs: MediatorKeyPairs;

beforeAll(async () => {
    const { adminApi, adminKeyPairs } = await getAdminApi();

    await adminApi.resetAppointmentsDb(adminKeyPairs);

    mediatorApiKeyPairs = await adminApi.generateMediatorKeys(adminKeyPairs);
    await adminApi.addMediatorPublicKeys(mediatorApiKeyPairs, adminKeyPairs);

    const mediatorResult = await getMediatorApi({ adminKeyPairs });

    mediatorApi = mediatorResult.mediatorApi;
    mediatorApiKeyPairs = mediatorResult.mediatorKeyPairs;
});

describe("MediatorService", () => {
    let provider: ProviderData;

    it("should create unverified provider", async () => {
        const { providerKeyPairs } = await getProviderApi();

        provider = await createUnverifiedProvider(providerKeyPairs);
    });

    it("should get pending provider", async () => {
        expect(provider).toHaveProperty("id");

        const pendingProviders = await mediatorApi.getPendingProviders(
            mediatorApiKeyPairs
        );

        expect(pendingProviders).toHaveLength(1);
        expect(pendingProviders[0].name).toEqual(provider.name);
    });

    it("should confirm provider", async () => {
        const confirmedProvider = await mediatorApi.confirmProvider(
            provider,
            mediatorApiKeyPairs
        );

        expect(confirmedProvider).toHaveProperty("name");
    });

    it("should get 0 pending providers", async () => {
        const pendingProviders = await mediatorApi.getPendingProviders(
            mediatorApiKeyPairs
        );

        expect(pendingProviders).toHaveLength(0);
    });

    it("should get 1 verified provider", async () => {
        const verifiedProviders = await mediatorApi.getVerifiedProviders(
            mediatorApiKeyPairs
        );

        expect(verifiedProviders).toHaveLength(1);
    });
});
