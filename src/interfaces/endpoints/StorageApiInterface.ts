// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { ApiSettingsData } from "../api";

export interface StorageApiInterface {
    storeSettings: ({
        id,
        data,
    }: {
        id: string;
        data: ApiSettingsData;
    }) => "ok";

    getSettings: ({ id }: { id: string }) => ApiSettingsData;

    deleteSettings: ({ id }: { id: string }) => "ok";

    resetDB: () => "ok";
}
