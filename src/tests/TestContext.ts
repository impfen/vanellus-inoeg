// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import {
    AdminApi,
    AnonymousApi,
    MediatorApi,
    ProviderApi,
    StorageApi,
    UserApi,
} from "..";
import type {
    AdminConfig,
    AdminKeyPairs,
    MediatorKeyPairs,
    Provider,
    ProviderInput,
    ProviderKeyPairs,
    VanellusConfig,
} from "../interfaces";
import { dayjs } from "../utils";

/**
 * Provides an isolated context for testing vanellus.
 *
 * It does all the tedious setup-work for the different apis, creates the keys for
 * the admin and mediator and adds those keys to the system.
 * It also provides several helper functions to quickly create testing-scenarios.
 *
 * Additionally, it guarantees db-resets between individual tests so that every test gets an isolated,
 * fresh environment with no leakage of data or context in between.
 */
export class TestContext {
    public static vanellusConfig: VanellusConfig = {
        jsonrpc: {
            appointments:
                process.env.KIEBITZ_APPOINTMENTS_ENDPOINT ||
                `http://127.0.0.1:22222/jsonrpc`,
            storage:
                process.env.KIEBITZ_STORAGE_ENDPOINT ||
                `http://127.0.0.1:11111/jsonrpc`,
        },
    };

    /**
     * Main entrypoint to create and isolate TestContexts.
     * It does all the heavy-lifting for you.
     */
    public static async createContext() {
        const adminConfig = (await import(
            `${
                process.env.KIEBITZ_SETTINGS || "../../testing/fixtures/keys"
            }/002_admin.json`
        )) as AdminConfig;

        const config: VanellusConfig = this.vanellusConfig;
        const adminApi = new AdminApi(config);

        const adminKeyPairs = await AdminApi.generateAdminKeys(adminConfig);

        await adminApi.resetDb(adminKeyPairs);
        await adminApi.resetStorage(adminKeyPairs);

        const mediatorKeyPairs = await adminApi.generateMediatorKeys(
            adminKeyPairs
        );

        await adminApi.addMediatorPublicKeys(mediatorKeyPairs, adminKeyPairs);

        const anonymousApi = new AnonymousApi(config);
        const mediatorApi = new MediatorApi(config);
        const providerApi = new ProviderApi(config);
        const userApi = new UserApi(config);
        const storageApi = new StorageApi(config);

        const context = new TestContext(
            config,
            anonymousApi,
            adminApi,
            mediatorApi,
            providerApi,
            userApi,
            storageApi,
            adminKeyPairs,
            mediatorKeyPairs
        );

        return context;
    }

    public defaultProviderData: ProviderInput = {
        name: "Ada Lovelace",
        street: "Spielstraße 23",
        city: "Berlin",
        zipCode: "10707",
        description: "This is dummy data",
        email: "ada@lovelace.net",
        website: "https://en.wikipedia.org/wiki/Ada_Lovelace",
        accessible: true,
    };

    /**
     * This constructor is protected as the entrypoint to this class is
     * TestContext.createContext() and the constructor isn't meant to be directly called.
     */
    protected constructor(
        public readonly config: VanellusConfig,
        public readonly anonymousApi: AnonymousApi,
        public readonly adminApi: AdminApi,
        public readonly mediatorApi: MediatorApi,
        public readonly providerApi: ProviderApi,
        public readonly userApi: UserApi,
        public readonly storageApi: StorageApi,
        public readonly adminKeyPairs: AdminKeyPairs,
        public readonly mediatorKeyPairs: MediatorKeyPairs
    ) {}

    /**
     * Helper to create an unverified provider and store it in the system
     *
     * It creates and returns the provider and the associated keypair.
     * That's, basically, all thats needed to represent a provider inside the system.
     */
    public async createUnverifiedProvider(
        providerInput: Partial<ProviderInput> = {}
    ) {
        const providerKeyPairs = await this.providerApi.generateKeyPairs();

        const provider = await this.providerApi.storeProvider(
            {
                ...this.defaultProviderData,
                ...providerInput,
            },
            providerKeyPairs
        );

        return {
            provider,
            providerKeyPairs,
        };
    }

    /**
     * Helper to create and confirm a provider and store it in the system
     *
     * It creates and returns the provider and the associated keypair.
     * That's, basically, all thats needed to represent a provider inside the system.
     */
    public async createVerifiedProvider(
        providerInput: Partial<ProviderInput> = {}
    ) {
        const { provider: unverifiedProvider, providerKeyPairs } =
            await this.createUnverifiedProvider({
                ...this.defaultProviderData,
                ...providerInput,
            });

        const provider = await this.mediatorApi.confirmProvider(
            unverifiedProvider,
            this.mediatorKeyPairs
        );

        return {
            provider,
            providerKeyPairs,
        };
    }

    /**
     * Helper to create an unpublished appointment
     */
    public createUnpublishedAppointment({
        provider,
        providerKeyPairs,
    }: {
        provider: Provider;
        providerKeyPairs: ProviderKeyPairs;
    }) {
        const startDate = dayjs()
            .utc()
            .add(1, "day")
            .hour(7)
            .minute(0)
            .second(0)
            .toDate();

        return this.providerApi.createAppointment(
            startDate,
            10,
            "biontech",
            2,
            provider,
            providerKeyPairs
        );
    }

    /**
     * Helper to create and confirm an appointment in the system
     */
    public async createConfirmedAppointment({
        provider,
        providerKeyPairs,
    }: {
        provider: Provider;
        providerKeyPairs: ProviderKeyPairs;
    }) {
        const unconfirmedAppointment = this.createUnpublishedAppointment({
            provider,
            providerKeyPairs,
        });

        const appointments = await this.providerApi.publishAppointments(
            unconfirmedAppointment,
            providerKeyPairs
        );

        return appointments[0];
    }

    /**
     * Helper to create both, the secret and the associated QueueToken, for a user.
     * That's, basically, all that's needed to represent a user inside the system and
     * book an appointment.
     */
    public async createUserQueueToken() {
        const userSecret = this.userApi.generateSecret();
        const userQueueToken = await this.userApi.getQueueToken(userSecret);

        return {
            userQueueToken,
            userSecret,
        };
    }
}
