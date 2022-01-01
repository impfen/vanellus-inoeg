// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { equal } from "assert"
import { formatDate } from "../helpers/time"
import { ecdhDecrypt } from "../crypto"
import { Status } from "../interfaces"
import {
    adminKeys,
    resetDB,
    mediator,
    backend,
    unverifiedProvider,
} from "../testing/fixtures"
import { VanellusError } from '../errors'

describe("Provider.storeData()", function () {
    it("we should be able to store provider data", async function () {
        const be = backend()
        const keys = await adminKeys()
        await resetDB(be, keys)
        const med = await mediator(be, keys)
        const up = await unverifiedProvider(be, keys)

        const result = await up.storeData()

        if (result instanceof VanellusError)
            throw new Error("cannot store provider data")
    })
})
