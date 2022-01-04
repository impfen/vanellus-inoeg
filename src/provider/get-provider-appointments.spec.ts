// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { VanellusError } from "../errors"
import { formatDatetime } from "../helpers/time"
import {
    adminKeys,
    backend,
    mediator,
    resetDB,
    verifiedProvider,
} from "../testing/fixtures"

describe("Provider.getAppointments()", function () {
    it("we should be able to get provider appointments", async function () {
        const be = backend()
        const keys = await adminKeys()
        await resetDB(be, keys)
        const med = await mediator(be, keys)
        const vp = await verifiedProvider(be, keys, med)
        if (vp instanceof VanellusError)
            throw new Error("could not verify provider")

        const fromDate = new Date()
        const toDate = new Date(fromDate.getTime() + 60 * 60 * 24 * 1000)
        const result = await vp.getProviderAppointments({
            from: formatDatetime(fromDate),
            to: formatDatetime(toDate),
        })
        if (result instanceof VanellusError)
            throw new Error("could not get appointments")
    })
})
