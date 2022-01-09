// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Provider, PublicProvider } from "../../interfaces";
import { ECDHData, SignedData } from "./crypto";

export type ProviderBackupReferenceData = Record<string, unknown>;

export interface EncryptedProviderData {
    id: string;
    encryptedData: ECDHData;
}

export interface ApiEncryptedProviderData {
    encryptedData: ECDHData;
}

export interface EncryptedConfirmedProviderData {
    iv: string;
    data: string;
    json?: ProviderData;
}

export interface ApiConfirmedProviderData extends SignedData {
    json?: EncryptedConfirmedProviderData;
}

export type VerifiedProviderData = Record<string, string>;

export interface ApiSignedPublicProvider extends SignedData {
    id: string;
    json?: PublicProviderData;
}

export interface PublicProviderData extends PublicProvider {
    id: string;
}

export interface ProviderPublicKeys {
    signing: string;
    encryption: string;
    data: string;
}

export interface ProviderData extends Provider {
    publicKeys: ProviderPublicKeys;
    submittedAt?: string;
    version?: string;
    id: string;
}

export interface ProviderSignedData {
    signedData: SignedData;
    signedPublicData: SignedData;
}
