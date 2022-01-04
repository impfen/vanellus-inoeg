// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import "cross-fetch/polyfill"
import crypto from "crypto"
import { Settings } from "../interfaces"

// @ts-expect-error setup webcrypto api in node-env
global.crypto = crypto.webcrypto

export const settingsPath = process.env.KIEBITZ_SETTINGS || "test_backend/keys"
export const appointmentsPort = process.env.KIEBITZ_APPOINTMENTS_PORT || "22222"
export const storagePort = process.env.KIEBITZ_STORAGE_PORT || "11111"

export const settingsJSONRPC: Settings = {
    appointment: {
        properties: {},
    },
    apiUrls: {
        appointments: `http://127.0.0.1:${appointmentsPort}/jsonrpc`,
        storage: `http://127.0.0.1:${storagePort}/jsonrpc`,
    },
}

export const settingsREST: Settings = {
    appointment: {
        properties: {},
    },
    apiUrls: {
        appointments: `http://127.0.0.1:${appointmentsPort}/`,
        storage: `http://127.0.0.1:${storagePort}/`,
    },
}
