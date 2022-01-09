// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import {
    createUnverifiedProvider,
    getAdminApi,
    getMediatorApi,
    getProviderApi,
} from "../../tests/test-utils";
import { Provider } from "../interfaces";
import { MediatorKeyPairs } from "./interfaces";
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
    describe("confirm a provider", () => {
        let providerData: Provider;

        it("should create unverified provider", async () => {
            const { providerKeyPairs } = await getProviderApi();

            providerData = await createUnverifiedProvider(providerKeyPairs);
        });

        it("should get pending provider", async () => {
            expect(providerData).toHaveProperty("id");

            const pendingProviders = await mediatorApi.getPendingProviders(
                mediatorApiKeyPairs
            );

            expect(pendingProviders).toHaveLength(1);
            expect(pendingProviders[0].name).toEqual(providerData.name);
        });

        it("should confirm provider", async () => {
            const confirmedProvider = await mediatorApi.confirmProvider(
                providerData,
                mediatorApiKeyPairs
            );

            expect(confirmedProvider).toHaveProperty("name");
        });

        it("should not fetch pending providers after confirmation", async () => {
            const pendingProviders = await mediatorApi.getPendingProviders(
                mediatorApiKeyPairs
            );

            expect(pendingProviders).toHaveLength(0);
        });

        it("should get verified providers", async () => {
            const verifiedProviders = await mediatorApi.getVerifiedProviders(
                mediatorApiKeyPairs
            );

            expect(verifiedProviders).toHaveLength(1);
        });
    });
});
