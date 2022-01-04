// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import {
    Backend,
    InMemoryStorage,
    JSONRPCBackend,
    RESTBackend,
    StorageStore,
} from "../../backend"
import { Store } from "../../interfaces"
import { settingsJSONRPC, settingsREST } from "../settings"

export function backend(): Backend {
    const store: Store = new StorageStore(new InMemoryStorage())
    const temporaryStore: Store = new StorageStore(new InMemoryStorage())
    let appointmentsNetworkBackend
    let storageNetworkBackend

    if (process.env.KIEBITZ_USE_REST === "true") {
        appointmentsNetworkBackend = new RESTBackend(
            settingsREST.apiUrls.appointments
        )
        storageNetworkBackend = new RESTBackend(settingsREST.apiUrls.storage)
    } else {
        appointmentsNetworkBackend = new JSONRPCBackend(
            settingsJSONRPC.apiUrls.appointments
        )
        storageNetworkBackend = new JSONRPCBackend(
            settingsJSONRPC.apiUrls.storage
        )
    }

    return new Backend(
        store,
        temporaryStore,
        appointmentsNetworkBackend,
        storageNetworkBackend
    )
}
