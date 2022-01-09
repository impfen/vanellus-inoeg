export interface AdminConfig {
    admin: {
        signing: {
            keys: {
                name: string;
                type: string;
                format: string;
                params: Record<string, string>;
                purposes: string[];
                publicKey: string;
                privateKey: string;
            }[];
        };
    };
}
