// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { PrefixStore } from "./store"
import { AppointmentsBackend } from "./appointments"
import { StorageBackend } from "./storage"
import { LocalBackend } from "./local"
import JSONRPCBackend from "./jsonrpc"
import RESTBackend from "./rest"
import { Settings, Store } from "../interfaces"

export * from "./store"

export class Backend {
    public local: LocalBackend
    public storage: StorageBackend
    public temporary: LocalBackend
    public settings: Settings
    public appointments: AppointmentsBackend

    constructor(settings: Settings, store: Store, temporaryStore: Store) {
        this.settings = settings
        const apiUrls = this.settings.apiUrls
        /*
        const storageNetworkBackend = new JSONRPCBackend(apiUrls.storage)
        const appointmentsNetworkBackend = new JSONRPCBackend(
            apiUrls.appointments
        )
        */
        const storageNetworkBackend = new RESTBackend(apiUrls.storage)
        const appointmentsNetworkBackend = new RESTBackend(
            apiUrls.appointments
        )
        this.storage = new StorageBackend(storageNetworkBackend)
        this.appointments = new AppointmentsBackend(appointmentsNetworkBackend)
        this.local = new LocalBackend(settings, new PrefixStore(store, "local"))
        this.temporary = new LocalBackend(
            settings,
            new PrefixStore(temporaryStore, "temporary")
        )
    }
}
