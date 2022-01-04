// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { PrefixStore } from "./store"
import { AppointmentsBackend } from "./appointments"
import { StorageBackend } from "./storage"
import { LocalBackend } from "./local"
import { Settings, Store } from "../interfaces"

export * from "./store"

export class Backend {
    public local: LocalBackend
    public storage: StorageBackend
    public temporary: LocalBackend
    public appointments: AppointmentsBackend

    constructor(settings: Settings, store: Store, temporaryStore: Store) {
        this.storage = new StorageBackend(settings.apiUrls["storage"])
        this.appointments = new AppointmentsBackend(settings.apiUrls["appointments"])
        this.local = new LocalBackend(new PrefixStore(store, "local"))
        this.temporary = new LocalBackend(
            new PrefixStore(temporaryStore, "temporary")
        )
    }
}
