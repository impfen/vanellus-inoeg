// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import {
    createUnverifiedProvider,
    getAdminApi,
    getMediatorApi,
    getProviderApi,
} from "../../tests/test-utils";
import { MediatorKeyPairs, Provider, ProviderKeyPairs } from "./interfaces";
import { MediatorApi } from "./MediatorApi";

let mediatorApi: MediatorApi;
let mediatorApiKeyPairs: MediatorKeyPairs;
let providerKeyPairs: ProviderKeyPairs;
let provider: Provider;

beforeEach(async () => {
    const { adminApi, adminKeyPairs } = await getAdminApi();

    await adminApi.resetAppointmentsDb(adminKeyPairs);

    mediatorApiKeyPairs = await adminApi.generateMediatorKeys(adminKeyPairs);
    await adminApi.addMediatorPublicKeys(mediatorApiKeyPairs, adminKeyPairs);

    const mediatorResult = await getMediatorApi({ adminKeyPairs });

    mediatorApi = mediatorResult.mediatorApi;
    mediatorApiKeyPairs = mediatorResult.mediatorKeyPairs;

    const providerResult = await getProviderApi();

    providerKeyPairs = providerResult.providerKeyPairs;

    provider = await createUnverifiedProvider(providerKeyPairs);
});

describe("MediatorService", () => {
    it("should be able to confirm a provider", async () => {
        expect(provider).toHaveProperty("name");

        let pendingProviders = await mediatorApi.getPendingProviders(
            mediatorApiKeyPairs
        );

        expect(pendingProviders).toHaveLength(1);
        expect(pendingProviders[0].name).toEqual(provider.name);

        provider = await mediatorApi.confirmProvider(
            pendingProviders[0],
            mediatorApiKeyPairs
        );

        expect(provider).toHaveProperty("name");

        pendingProviders = await mediatorApi.getPendingProviders(
            mediatorApiKeyPairs
        );

        // the pending provider data should be gone
        expect(pendingProviders).toHaveLength(0);

        const verifiedProviders = await mediatorApi.getVerifiedProviders(
            mediatorApiKeyPairs
        );

        // we should have a verified provider
        expect(verifiedProviders).toHaveLength(1);
    });
});
