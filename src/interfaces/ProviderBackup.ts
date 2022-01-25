// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { Provider } from "./Provider";

export interface ProviderBackup {
    verifiedProvider?: Provider;
    unverifiedProvider?: Provider;
}
