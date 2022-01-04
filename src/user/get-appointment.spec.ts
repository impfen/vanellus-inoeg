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
import { User } from "./"

describe("User.getAppointment()", function () {
    it("we should be able to get appointments", async function () {
        const be = backend()

        const keys = await adminKeys()
        // we reset the database
        await resetDB(be, keys)
        // we create a mediator
        const med = await mediator(be, keys)
        // we create an unverified provider
        const vp = await verifiedProvider(be, keys, med)

        if (vp instanceof VanellusError)
            throw new Error("cannot verify appointment")

        const date = new Date()

        // tomorrow 3 pm

        date.setDate(date.getDate() + 1)
        date.setHours(15)
        date.setMinutes(0)
        date.setSeconds(0)
        date.setMilliseconds(0)

        const app = await vp.createAppointment(
            15,
            "moderna",
            5,
            date.toISOString()
        )

        const publishResult = await vp.publishAppointments([app])

        if (publishResult instanceof VanellusError)
            throw new Error("cannot create appointment")

        const user = new User("main", be)
        // we generate a secret etc.
        user.initialize()
        // we set the queue data
        user.queueData = {
            zipCode: "10707",
        }
        // we set the contact data
        user.contactData = {
            name: "Max Mustermann",
        }

        const fromDate = new Date()
        // 24 hours in the future
        const toDate = new Date(new Date().getTime() + 48 * 60 * 60 * 1000)
        const result = await user.getAppointments({
            from: formatDatetime(fromDate),
            to: formatDatetime(toDate),
            radius: 10,
            zipCode: user.queueData.zipCode,
        })

        if (result instanceof VanellusError) throw new Error("should not fail")

        if (result.appointments.length !== 1)
            throw new Error("should return one appointment")

        const getResult = await user.getAppointment({
            id: result.appointments[0].appointments[0].id,
            providerID: result.appointments[0].provider.id,
        })

        if (getResult instanceof VanellusError)
            throw new Error("should be able to get appointment")

        if (getResult.appointment.id !== app.id)
            throw new Error("IDs should match")
    })
})
