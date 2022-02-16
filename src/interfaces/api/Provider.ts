// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { ECDHData, SignedData } from "./crypto";
import type { ProviderStatus } from "../Provider";

export type ApiSignedProvider = SignedData;

export interface SignedProvider {
    signedData: SignedData;
    signedPublicData: SignedData;
}

export interface ApiEncryptedProvider {
    id: string;
    status: ProviderStatus;
    encryptedData: ECDHData;
}

export interface ApiProviderDataPair {
    unverifiedData: ApiEncryptedProvider;
    verifiedData?: ApiEncryptedProvider;
}

export interface ApiSignedProviderData extends SignedData {
    id: string;
}

export interface ProviderKeyData {
    signing: string;
    encryption: string;
}
