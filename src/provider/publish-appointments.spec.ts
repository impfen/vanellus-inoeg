// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { equal } from "assert"
import { VanellusError } from "../errors"
import { formatDatetime } from "../helpers/time"
import {
    adminKeys,
    backend,
    mediator,
    resetDB,
    verifiedProvider,
} from "../testing/fixtures"

describe("Provider.publishAppointments()", function () {
    it("we should be able to publish appointments", async function () {
        const be = backend()
        const keys = await adminKeys()
        await resetDB(be, keys)
        const med = await mediator(be, keys)
        const vp = await verifiedProvider(be, keys, med)

        if (vp instanceof VanellusError)
            throw new Error("cannot verify provider")

        const appointments = []

        let date = new Date()

        // tomorrow 3 pm

        date.setDate(date.getDate() + 1)
        date.setHours(15)
        date.setMinutes(0)
        date.setSeconds(0)
        date.setMilliseconds(0)

        for (let i = 0; i < 5; i++) {
            const app = await vp.createAppointment(
                15,
                "moderna",
                5,
                date.toISOString()
            )

            appointments.push(app)
            // 5 minutes later
            date = new Date(date.getTime() + 5 * 60 * 1000)
        }

        const publishResult = await vp.publishAppointments(appointments)

        if (publishResult instanceof VanellusError)
            throw new Error("cannot publish appointments")

        const fromDate = new Date()
        const toDate = new Date(fromDate.getTime())
        toDate.setDate(toDate.getDate() + 2)

        const getResult = await vp.getProviderAppointments({
            from: formatDatetime(fromDate),
            to: formatDatetime(toDate),
        })

        if (getResult instanceof VanellusError)
            throw new Error("cannot get appointments")
        if (getResult.appointments.length != 5)
            throw new Error("expected 5 appointments")

        for (const app of getResult.appointments) {
            equal(app.properties.vaccine, "moderna")
            equal(app.duration, 15)
            equal(app.slotData.length, 5)
        }
    })
})
