// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

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
