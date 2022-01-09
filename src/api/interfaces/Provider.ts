// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Provider, PublicProvider } from "../../interfaces";
import { ECDHData, SignedData } from "./crypto";

export type ProviderBackupReferenceData = Record<string, unknown>;

export type VerifiedProviderData = Record<string, string>;
export interface EncryptedConfirmedProviderData {
    iv: string;
    data: string;
    json?: Provider;
}

export interface SignedProvider {
    signedData: SignedData;
    signedPublicData: SignedData;
}

export interface ApiEncryptedProviderData {
    id: string;
    encryptedData: ECDHData;
}

export interface ApiConfirmedProviderData extends SignedData {
    json?: EncryptedConfirmedProviderData;
}
export interface ApiSignedPublicProvider extends SignedData {
    id: string;
    json?: PublicProvider;
}
