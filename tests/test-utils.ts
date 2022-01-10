import {
    AnonymousApi,
    MediatorApi,
    ProviderApi,
    UserApi,
    vanellusConfig,
} from "../src";
import { AdminApi } from "../src/api/AdminApi";
import {
    AdminConfig,
    AdminKeyPairs,
    MediatorKeyPairs,
    ProviderKeyPairs,
    UserKeyPairs,
} from "../src/api/interfaces";
import { ProviderInput } from "../src/interfaces";

const defaultProviderData: ProviderInput = {
    name: "Max Mustermann",
    street: "Musterstr. 23",
    city: "Berlin",
    zipCode: "10707",
    description: "",
    email: "max@mustermann.de",
    accessible: true,
};

const adminJsonPath = `${
    process.env.KIEBITZ_SETTINGS || "./fixtures/keys"
}/002_admin.json`;

export const getAnonymousApi = () => {
    const anonymousApi = new AnonymousApi(vanellusConfig);

    return anonymousApi;
};

export const getAdminApi = async (adminKeyPairs?: AdminKeyPairs) => {
    if (!adminKeyPairs) {
        const jsonData = (await import(adminJsonPath)) as AdminConfig;

        adminKeyPairs = await AdminApi.generateAdminKeys(jsonData);
    }

    const adminApi = new AdminApi(vanellusConfig);

    return {
        adminApi,
        adminKeyPairs,
    };
};

export const getUserApi = async (
    userKeyPairs?: UserKeyPairs,
    userSecret?: string
) => {
    const userApi = new UserApi(vanellusConfig);

    if (!userSecret) {
        userSecret = userApi.generateSecret();
    }

    if (!userKeyPairs) {
        userKeyPairs = await userApi.generateKeyPairs();
    }

    return {
        userApi,
        userSecret,
        userKeyPairs,
    };
};

export const getProviderApi = async (providerKeyPairs?: ProviderKeyPairs) => {
    const providerApi = new ProviderApi(vanellusConfig);

    if (!providerKeyPairs) {
        providerKeyPairs = await providerApi.generateKeyPairs();
    }

    return {
        providerApi,
        providerKeyPairs,
    };
};

export const getMediatorApi = async ({
    mediatorKeyPairs,
    adminKeyPairs,
}: {
    adminKeyPairs?: AdminKeyPairs;
    mediatorKeyPairs?: MediatorKeyPairs;
}) => {
    const mediatorApi = new MediatorApi(vanellusConfig);

    if (!mediatorKeyPairs) {
        const adminResult = await getAdminApi(adminKeyPairs);

        mediatorKeyPairs = await adminResult.adminApi.generateMediatorKeys(
            adminResult.adminKeyPairs
        );
        await adminResult.adminApi.addMediatorPublicKeys(
            mediatorKeyPairs,
            adminResult.adminKeyPairs
        );
    }

    return {
        mediatorApi,
        mediatorKeyPairs,
    };
};

export const createUnverifiedProvider = async (
    providerKeyPairs: ProviderKeyPairs,
    providerInput: ProviderInput = defaultProviderData
) => {
    const { providerApi } = await getProviderApi(providerKeyPairs);

    return providerApi.storeProvider(providerInput, providerKeyPairs);
};

export const createVerifiedProvider = async (
    providerKeyPairs: ProviderKeyPairs,
    mediatorKeyPairs: MediatorKeyPairs
) => {
    const { mediatorApi } = await getMediatorApi({ mediatorKeyPairs });
    const provider = await createUnverifiedProvider(providerKeyPairs);

    await mediatorApi.confirmProvider(provider, mediatorKeyPairs);

    return provider;
};
