// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ActorKeyPairs, SignedData } from ".";
import { ECDHData, KeyPair } from "./crypto";

export type ProviderBackupReferenceData = Record<string, unknown>;

export type EncryptedProviderData = ECDHData;
export interface ApiEncryptedProviderData {
    encryptedData: EncryptedProviderData;
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

export interface SignedPublicProvider extends SignedData {
    id: string;
    json?: PublicProviderData;
}

export interface PublicProviderData {
    id: string;
    name: string;
    street: string;
    city: string;
    zipCode: string;
    description: string;
    accessible: boolean;
}

export interface ProviderInput {
    name: string;
    street: string;
    city: string;
    zipCode: string;
    description: string;
    email: string;
    accessible: boolean;
    website?: string;
}

export interface ProviderPublicKeys {
    signing: string;
    encryption: string;
    data: string;
}

export interface ProviderData extends ProviderInput {
    publicKeys: ProviderPublicKeys;
    submittedAt?: string;
    version?: string;
    id?: string;
}

export interface ProviderKeyPairs extends ActorKeyPairs {
    encryption: KeyPair;
    data: KeyPair;
    sync: string;
}

export interface ProviderSignedData {
    signedData: SignedData;
    signedPublicData: SignedData;
}
