import { Provider } from "../interfaces";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import { ApiEncryptedProviderData, SignedData } from "./interfaces";

export interface MediatorApiInterface extends AnonymousApiInterface {
    confirmProvider: ({
        confirmedProviderData,
        publicProviderData,
        signedKeyData,
    }: {
        confirmedProviderData: SignedData;
        publicProviderData: SignedData;
        signedKeyData: SignedData;
    }) => "ok";

    getPendingProviderData: ({
        limit,
    }: {
        limit: undefined | number;
    }) => Omit<ApiEncryptedProviderData, "id">[];

    getVerifiedProviderData: ({
        limit,
    }: {
        limit: undefined | number;
    }) => Omit<ApiEncryptedProviderData, "id">[];

    checkProviderData: () => Provider;
}
