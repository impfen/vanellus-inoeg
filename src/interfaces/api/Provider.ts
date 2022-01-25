// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { ECDHData, SignedData } from "./crypto";

export type ApiSignedProvider = SignedData;

export interface SignedProvider {
    signedData: SignedData;
    signedPublicData: SignedData;
}

export interface ApiEncryptedProvider {
    id: string;
    verified: boolean;
    encryptedData: ECDHData;
}

export interface ApiProviderDataPair {
    unverifiedData: ApiEncryptedProvider;
    verifiedData?: ApiEncryptedProvider;
}

export interface ApiSignedProviderData extends SignedData {
    id: string;
}

export interface ApiProviderData {
    name: string;
    street: string;
    city: string;
    zipCode: string;
    description: string;
    accessible: boolean;
}
