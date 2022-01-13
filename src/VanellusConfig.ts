// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { VanellusConfig } from "./interfaces";

export const vanellusConfig: VanellusConfig = {
    jsonrpc: {
        appointments:
            process.env.KIEBITZ_APPOINTMENTS_ENDPOINT ||
            `http://127.0.0.1:22222/jsonrpc`,
        storage:
            process.env.KIEBITZ_STORAGE_ENDPOINT ||
            `http://127.0.0.1:11111/jsonrpc`,
    },
};
