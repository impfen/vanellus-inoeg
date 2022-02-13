// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { VersionMetadata } from "./VersionMetadata";

export enum ProviderStatus {
    UNVERIFIED = "UNVERIFIED",
    VERIFIED = "VERIFIED",
    UPDATED = "UPDATED",
}

export interface ProviderPublicKeys {
    signing: string;
    encryption: string;
    data: string;
}

export interface ProviderInput extends VersionMetadata {
    name: string;
    street: string;
    city: string;
    zipCode: string;
    description: string;
    accessible: boolean;
    website?: string;
    email: string;
}

export interface PublicProvider extends Omit<ProviderInput, "email"> {
    id: string;
}

export interface Provider extends ProviderInput {
    id: string;
    publicKeys: ProviderPublicKeys;
}

export interface ProviderPair {
    unverifiedProvider: Provider;
    verifiedProvider?: Provider;
    status: ProviderStatus;
}
