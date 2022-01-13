// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { SignedData } from "../api";

export interface AdminApiInterface {
    resetDB: () => "ok";

    addMediatorPublicKeys: ({
        signedKeyData,
    }: {
        signedKeyData: SignedData;
    }) => "ok";
}
