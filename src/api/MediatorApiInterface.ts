import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    ApiEncryptedProviderData,
    ProviderData,
    SignedData,
} from "./interfaces";

export interface MediatorApiInterface extends AnonymousApiInterface {
    confirmProvider: ({
        confirmedProviderData,
        publicProviderData,
        signedKeyData,
    }: {
        confirmedProviderData: SignedData;
        publicProviderData: SignedData;
        signedKeyData: SignedData;
    }) => boolean;

    getPendingProviderData: ({
        limit,
    }: {
        limit: undefined | number;
    }) => ApiEncryptedProviderData[];

    getVerifiedProviderData: ({
        limit,
    }: {
        limit: undefined | number;
    }) => ApiEncryptedProviderData[];

    checkProviderData: () => ProviderData;
}
