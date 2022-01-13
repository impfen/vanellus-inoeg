// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

/**
 * Returns various required public keys. Please note that you should have an independent
 * verification mechanism for these keys and not blindly trust the ones provided by this API.
 */
export interface BackendPublicKeys {
    /** Public provider data key. */
    providerData: string;
    /** Public root key. */
    tokenKey: string;
    /** Public token key. */
    rootKey: string;
}
