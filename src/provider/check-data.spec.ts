// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { VanellusError } from "../errors"
import {
    adminKeys,
    backend,
    mediator,
    resetDB,
    unverifiedProvider,
} from "../testing/fixtures"

describe("Provider.checkData()", function () {
    it("we should be able to retrieve confirmed provider data", async function () {
        const be = backend()
        const keys = await adminKeys()
        await resetDB(be, keys)
        const med = await mediator(be, keys)
        const provider = await unverifiedProvider(be)
        if (provider instanceof VanellusError)
            throw new Error("could not create unverified provider")

        const result = await provider.checkData()
        if (!(result instanceof VanellusError))
            throw new Error("check data should fail for unverified provider")

        const pendingProviders = await med.pendingProviders()
        if (pendingProviders instanceof VanellusError)
            throw new Error("could not get pending providers")

        const result2 = await med.confirmProvider(pendingProviders.providers[0])
        if (result2 instanceof VanellusError)
            throw new Error("could not confirm provider")

        const result3 = await provider.checkData()
        if (result3 instanceof VanellusError)
            throw new Error("check data failed for verified provider")
    })
})
