export interface PublicProvider {
    name: string;
    street: string;
    city: string;
    zipCode: string;
    description: string;
    accessible: boolean;
    website?: string;
}

export interface Provider extends PublicProvider {
    email: string;
}
