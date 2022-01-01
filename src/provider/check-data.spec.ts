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
    verifiedProvider,
} from "../testing/fixtures"
import { VanellusError } from '../errors'

describe("Provider.checkData()", function () {
    it("we should be able to retrieve confirmed provider data", async function () {
        const be = backend()
        const keys = await adminKeys()
        await resetDB(be, keys)
        const med = await mediator(be, keys)
        const vp = await verifiedProvider(be, keys, med)
        if (vp instanceof VanellusError)
            throw new Error("could not verify provider")

        const result = await vp.checkData()

        if (result instanceof VanellusError)
            throw new Error("cannot get confirmed data")
    })
})
