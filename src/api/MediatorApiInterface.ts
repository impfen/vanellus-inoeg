import { AnonymousApiInterface } from "./AnonymousApiInterface";
import { ApiEncryptedProvider, Provider, SignedData } from "./interfaces";

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
    }) => ApiEncryptedProvider[];

    getVerifiedProviderData: ({
        limit,
    }: {
        limit: undefined | number;
    }) => ApiEncryptedProvider[];

    checkProviderData: () => Provider;
}
