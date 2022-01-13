// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

export interface ProviderPublicKeys {
    signing: string;
    encryption: string;
    data: string;
}

export interface ProviderInput {
    name: string;
    street: string;
    city: string;
    zipCode: number | string;
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

export interface ProviderData {
    verifiedProvider: Provider | null;
    publicProvider: PublicProvider | null;
}
