// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { ProviderKeyPairs } from ".";

export interface ProviderBackup {
    version: "0.1";
    providerKeyPairs: ProviderKeyPairs;
    createdAt: string;
}
