// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Status } from "../interfaces"
import { equal } from "assert"
import { formatDatetime } from "../helpers/time"
import {
    backend,
    adminKeys,
    resetDB,
    mediator,
    verifiedProvider,
} from "../testing/fixtures"
import { User } from "./"
import { VanellusError } from '../errors'

describe("User.getAppointments()", function () {
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
            throw new Error("cannot verify provider")

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
            throw new Error("cannot publish appointment")

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
            zipCode: user.queueData.zipCode,
        })

        if (result instanceof VanellusError)
            throw new Error("should not fail")

        if (result instanceof VanellusError)
            throw new Error("should return one appointment")
    })
})