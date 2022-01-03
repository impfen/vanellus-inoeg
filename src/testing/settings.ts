// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import 'cross-fetch/polyfill';
import { Settings } from "../interfaces"

export const settingsPath =
    process.env.KIEBITZ_SETTINGS || "../services/settings/test"
export const appointmentsPort = process.env.KIEBITZ_APPOINTMENTS_PORT || "22222"
export const storagePort = process.env.KIEBITZ_STORAGE_PORT || "11111"

export const settings: Settings = {
    appointment: {
        properties: {},
    },
    apiUrls: {
        appointments: `http://127.0.0.1:${appointmentsPort}/jsonrpc`,
        storage: `http://127.0.0.1:${storagePort}/jsonrpc`,
    },
}
