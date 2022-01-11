export interface ProviderPublicKeys {
    signing: string;
    encryption: string;
    data: string;
}

export interface ProviderInput {
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
