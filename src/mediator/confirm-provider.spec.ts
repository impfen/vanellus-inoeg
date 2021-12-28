// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { equal } from "assert"
import { Status } from "../interfaces"
import {
    adminKeys,
    resetDB,
    mediator,
    backend,
    unverifiedProvider,
} from "../testing/fixtures"

describe("Mediator.confirmProvider()", function () {
    it("we should be able to confirm a provider", async function () {
        const be = backend()
        const keys = await adminKeys()
        await resetDB(be, keys)
        const med = await mediator(be, keys)
        const up = await unverifiedProvider(be, keys)
        let pendingProviders = await med.pendingProviders()

        if (pendingProviders.status == Status.Failed) {
            throw new Error("fetching provider data failed")
        }

        equal(pendingProviders.providers.length, 1)
        equal(pendingProviders.providers[0].data!.name, up.data!.name)

        const result = await med.confirmProvider(pendingProviders.providers[0])

        if ("error" in result) throw new Error("confirmation failed")

        pendingProviders = await med.pendingProviders()

        if (pendingProviders.status == Status.Failed) {
            throw new Error("fetching provider data failed")
        }

        // the pending provider data should be gone
        equal(pendingProviders.providers.length, 0)

        const verifiedProviders = await med.verifiedProviders()

        if (verifiedProviders.status == Status.Failed) {
            throw new Error("fetching provider data failed")
        }

        // we should have a verified provider
        equal(verifiedProviders.providers.length, 1)
    })
})
