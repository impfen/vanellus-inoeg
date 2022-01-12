import {
    AdminApi,
    AnonymousApi,
    MediatorApi,
    ProviderApi,
    UserApi,
    vanellusConfig,
} from "../src";
import { AdminConfig, AdminKeyPairs } from "../src/api/interfaces";
import { StorageApi } from "../src/api/StorageApi";
import {
    Config,
    MediatorKeyPairs,
    Provider,
    ProviderInput,
    ProviderKeyPairs,
} from "../src/interfaces";
import { dayjs } from "../src/utils";

/**
 * This class provides an isolated context for testing vanellus.
 *
 * It does all the tedious setup-work for the different apis, creates the keys for the
 * different actors and adds them to the system where necessary.
 * It also provides several helper functions to quickly create testing-scenarios.
 *
 * It also guarantees db-reset between individual tests so that every test gets an isolated
 * fresh environment with no leakage of data or context between them.
 */
export class TestContext {
    /**
     * Main entrypoint to create and isolate TestContexts.
     * It does all the heavy-lifting for you.
     */
    public static async createContext() {
        const adminConfig = (await import(
            `${
                process.env.KIEBITZ_SETTINGS || "./fixtures/keys"
            }/002_admin.json`
        )) as AdminConfig;

        const config: Config = vanellusConfig;
        const anonymousApi = new AnonymousApi(config);
        const adminApi = new AdminApi(config);
        const mediatorApi = new MediatorApi(config);
        const providerApi = new ProviderApi(config);
        const userApi = new UserApi(config);
        const storageApi = new StorageApi(config);

        const adminKeyPairs = await AdminApi.generateAdminKeys(adminConfig);

        await adminApi.resetDb(adminKeyPairs);
        await adminApi.resetStorage(adminKeyPairs);

        const mediatorKeyPairs = await adminApi.generateMediatorKeys(
            adminKeyPairs
        );
        await adminApi.addMediatorPublicKeys(mediatorKeyPairs, adminKeyPairs);

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
        description: "",
        email: "ada@lovelace.net",
        accessible: true,
    };

    /**
     * This constructor is protected as the entrypoint to this class is
     * TestContext.createContext() and the constructor isn't meant to be directly called.
     */
    protected constructor(
        public readonly config: Config,
        public readonly anonymousApi: AnonymousApi,
        public readonly adminApi: AdminApi,
        public readonly mediatorApi: MediatorApi,
        public readonly providerApi: ProviderApi,
        public readonly userApi: UserApi,
        public readonly storageApi: StorageApi,
        public readonly adminKeyPairs: AdminKeyPairs,
        public readonly mediatorKeyPairs: MediatorKeyPairs
    ) {}

    public async createUnverifiedProvider(
        providerInput: ProviderInput = this.defaultProviderData
    ) {
        const providerKeyPairs = await this.providerApi.generateKeyPairs();

        const provider = await this.providerApi.storeProvider(
            providerInput,
            providerKeyPairs
        );

        return {
            provider,
            providerKeyPairs,
        };
    }

    public async createVerifiedProvider(
        providerInput: ProviderInput = this.defaultProviderData
    ) {
        const { provider, providerKeyPairs } =
            await this.createUnverifiedProvider(providerInput);

        await this.mediatorApi.confirmProvider(provider, this.mediatorKeyPairs);

        return {
            provider,
            providerKeyPairs,
        };
    }

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
            10,
            provider,
            providerKeyPairs
        );
    }

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

    public async createUserQueueToken() {
        const userSecret = this.userApi.generateSecret();
        const userQueueToken = await this.userApi.getQueueToken(userSecret);

        return {
            userQueueToken,
            userSecret,
        };
    }
}
