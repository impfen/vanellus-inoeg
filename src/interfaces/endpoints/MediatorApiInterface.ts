// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type {
    ApiEncryptedProvider,
    ApiProviderDataPair,
    SignedData,
} from "../api";
import type { Provider } from "../Provider";
import type { AnonymousApiInterface } from "./AnonymousApiInterface";

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

    getProviderData: ({
        providerID,
    }: {
        providerID: string;
    }) => ApiProviderDataPair;

    checkProviderData: () => Provider;

    // check if the provider is recognized in the backend
    isValidMediator: () => boolean;
}
