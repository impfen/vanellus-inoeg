import { AnonymousApi, MediatorApi, ProviderApi, UserApi } from "../src";
import { AdminApi } from "../src/api/AdminApi";
import {
    AdminKeyPairs,
    MediatorKeyPairs,
    ProviderInput,
    ProviderKeyPairs,
    UserKeyPairs,
} from "../src/api/interfaces";
import { JsonRpcTransport } from "../src/api/transports";

const defaultProviderData: ProviderInput = {
    name: "Max Mustermann",
    street: "Musterstr. 23",
    city: "Berlin",
    zipCode: "10707",
    description: "",
    email: "max@mustermann.de",
    accessible: true,
};

const apiUrl =
    process.env.KIEBITZ_APPOINTMENT_ENDPOINT ||
    "http://localhost:22222/jsonrpc";

const adminJsonPath = `${
    process.env.KIEBITZ_SETTINGS || "../../tests/fixtures"
}/002_admin.json`;

export const getAnonymousApi = () => {
    const anonymousApi = new AnonymousApi(new JsonRpcTransport(apiUrl));

    return anonymousApi;
};

export const getAdminApi = async (adminKeyPairs?: AdminKeyPairs) => {
    if (!adminKeyPairs) {
        const jsonData = await import(adminJsonPath);

        adminKeyPairs = await AdminApi.generateAdminKeys(jsonData);
    }

    const adminApi = new AdminApi(new JsonRpcTransport(apiUrl));

    return {
        adminApi,
        adminKeyPairs,
    };
};

export const getUserApi = async (
    userKeyPairs?: UserKeyPairs,
    userSecret?: string
) => {
    const userApi = new UserApi(new JsonRpcTransport(apiUrl));

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
    const providerApi = new ProviderApi(new JsonRpcTransport(apiUrl));

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
    const mediatorApi = new MediatorApi(new JsonRpcTransport(apiUrl));

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
    providerData: ProviderInput = defaultProviderData
) => {
    const { providerApi } = await getProviderApi(providerKeyPairs);

    return providerApi.storeProvider(providerData, providerKeyPairs);
};

export const createVerifiedProvider = async (
    providerKeyPairs: ProviderKeyPairs,
    mediatorKeyPairs: MediatorKeyPairs
) => {
    const { mediatorApi } = await getMediatorApi({ mediatorKeyPairs });
    const provider = await createUnverifiedProvider(providerKeyPairs);

    const providerDatas = await mediatorApi.getPendingProviders(
        mediatorKeyPairs
    );

    const providerData = providerDatas.find(
        (pr) => pr.publicKeys.signing === provider.publicKeys.signing
    );

    if (!providerData) {
        throw new Error("Could not find pending provider");
    }

    return mediatorApi.confirmProvider(providerData, mediatorKeyPairs);
};
