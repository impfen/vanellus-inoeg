// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Actor } from "../actor"
import { Backend } from "../backend"
import { Optional } from "../helpers/optional"
import { MediatorKeyPairs } from "../interfaces"
import { confirmProvider } from "./confirm-provider"
import { getStats } from "./get-stats"
import { pendingProviders, verifiedProviders } from "./providers"

export class Mediator extends Actor {
    public confirmProvider = confirmProvider
    public pendingProviders = pendingProviders
    public verifiedProviders = verifiedProviders
    public getStats = getStats

    constructor(id: string, backend: Backend) {
        super("mediator", id, backend)
    }

    public get keyPairs(): Optional<MediatorKeyPairs> {
        return this.get("keyPairs")
    }

    public set keyPairs(keyPairs: Optional<MediatorKeyPairs>) {
        this.set("keyPairs", keyPairs)
    }

    /**
     * Deletes the local data for this mediator
     */

    public clear() {
        super.clear()
    }
}
