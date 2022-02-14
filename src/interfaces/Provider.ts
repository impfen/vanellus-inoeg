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

export interface CreateProviderInput {
    name: string;
    street: string;
    city: string;
    zipCode: string;
    description: string;
    accessible: boolean;
    website?: string;
    email: string;
}

export interface UpdateProviderInput
    extends CreateProviderInput,
        VersionMetadata {}

export interface PublicProvider extends Omit<UpdateProviderInput, "email"> {
    id: string;
}

export interface Provider extends UpdateProviderInput {
    id: string;
    publicKeys: ProviderPublicKeys;
}

export interface ProviderPair {
    unverifiedProvider: Provider;
    verifiedProvider?: Provider;
    status: ProviderStatus;
}
