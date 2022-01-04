// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { NetworkBackend, Store } from "../interfaces"
import { AppointmentsBackend } from "./appointments"
import { LocalBackend } from "./local"
import { StorageBackend } from "./storage"
import { PrefixStore } from "./store"

export * from "./jsonrpc"
export * from "./rest"
export * from "./store"

export class Backend {
    public appointments: AppointmentsBackend
    public local: LocalBackend
    public storage: StorageBackend
    public temporary: LocalBackend

    constructor(
        store: Store,
        temporaryStore: Store,
        appointmentsNetworkBackend: NetworkBackend<unknown>,
        storageNetworkBackend: NetworkBackend<unknown>
    ) {
        this.appointments = new AppointmentsBackend(appointmentsNetworkBackend)
        this.local = new LocalBackend(new PrefixStore(store, "local"))
        this.storage = new StorageBackend(storageNetworkBackend)
        this.temporary = new LocalBackend(
            new PrefixStore(temporaryStore, "temporary")
        )
    }
}
