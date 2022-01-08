// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

export const settingsPath =
    process.env.KIEBITZ_SETTINGS || "../../test_backend";

export const settingsJSONRPC = {
    apiUrls: {
        appointments: `http://127.0.0.1:22222/jsonrpc`,
        storage: `http://127.0.0.1:11111/jsonrpc`,
    },
};

export const settingsREST = {
    apiUrls: {
        appointments: `http://127.0.0.1:22222/`,
        storage: `http://127.0.0.1:11111/`,
    },
};
