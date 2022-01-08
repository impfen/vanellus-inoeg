export interface AdminConfig {
    admin: {
        signing: {
            keys: {
                name: string;
                type: string;
                format: string;
                params: Record<string, string>;
                publicKey: string;
                purposes: string[];
                privateKey: string;
            }[];
        };
    };
}
