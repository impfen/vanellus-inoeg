import {
    AnonymousApi,
    MediatorApi,
    ProviderApi,
    UserApi,
    vanellusConfig,
} from "../src";
import { AdminApi } from "../src/api/AdminApi";
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

export class TestContext {
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
        const userSecret = userApi.generateSecret();

        const context = new TestContext(
            config,
            anonymousApi,
            adminApi,
            mediatorApi,
            providerApi,
            userApi,
            storageApi,
            adminKeyPairs,
            mediatorKeyPairs,
            userSecret
        );

        return context;
    }

    public defaultProviderData: ProviderInput = {
        name: "Max Mustermann",
        street: "Musterstr. 23",
        city: "Berlin",
        zipCode: "10707",
        description: "",
        email: "max@mustermann.de",
        accessible: true,
    };

    protected constructor(
        public readonly config: Config,
        public readonly anonymousApi: AnonymousApi,
        public readonly adminApi: AdminApi,
        public readonly mediatorApi: MediatorApi,
        public readonly providerApi: ProviderApi,
        public readonly userApi: UserApi,
        public readonly storageApi: StorageApi,
        public readonly adminKeyPairs: AdminKeyPairs,
        public readonly mediatorKeyPairs: MediatorKeyPairs,

        public readonly userSecret: string
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
}
