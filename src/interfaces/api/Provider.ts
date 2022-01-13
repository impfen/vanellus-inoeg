// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ECDHData, SignedData } from "./crypto";

export type ApiSignedProvider = SignedData;

export interface SignedProvider {
    signedData: SignedData;
    signedPublicData: SignedData;
}

export interface ApiEncryptedProvider {
    id: string;
    encryptedData: ECDHData;
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
