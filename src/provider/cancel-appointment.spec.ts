// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { VanellusError } from "../errors"
import { formatDatetime } from "../helpers/time"
import {
    adminKeys,
    backend,
    mediator,
    resetDB,
    verifiedProvider,
} from "../testing/fixtures"
import { User } from "../user"

describe("Provider.cancelAppointments()", function () {
    it("we should be able to publish appointments", async function () {
        dayjs.extend(utc)
        let result

        const be = backend()
        const keys = await adminKeys()
        await resetDB(be, keys)
        const med = await mediator(be, keys)
        const vp = await verifiedProvider(be, keys, med)

        if (vp instanceof VanellusError)
            throw new Error("could not verify provider")

        // tomorrow 3 pm

        const date = dayjs().utc().add(1, "day").hour(15).minute(0).second(0)

        const app = await vp.createAppointment(
            15,
            "moderna",
            5,
            formatDatetime(date)
        )

        const publishResult = await vp.publishAppointments([app])

        if (publishResult instanceof VanellusError)
            throw new Error("cannot publish appointments")

        const fromDate = dayjs().utc()
        const toDate = dayjs().utc().add(1, "day")

        const getResult = await vp.getAppointments({
            from: formatDatetime(fromDate),
            to: formatDatetime(toDate),
        })

        if (getResult instanceof VanellusError)
            throw new Error("cannot get appointments")
        if (getResult.appointments.length != 1)
            throw new Error("expected 5 appointments")

        const user = new User("main", be)
        user.initialize()
        user.queueData = {
            zipCode: "10707",
        }
        user.contactData = {
            name: "Max Mustermann",
        }

        result = await user.getAppointments({
            from: formatDatetime(fromDate),
            to: formatDatetime(toDate),
            radius: 10,
            zipCode: user.queueData.zipCode,
        })

        if (result instanceof VanellusError) throw new Error("should not fail")

        if (result.appointments.length !== 1)
            throw new Error("should return one appointment")

        await vp.cancelAppointment(app)

        result = await user.getAppointments({
            from: formatDatetime(fromDate),
            to: formatDatetime(toDate),
            radius: 10,
            zipCode: user.queueData.zipCode,
        })

        if (result instanceof VanellusError) throw new Error("should not fail")

        if (result.appointments.length !== 0)
            throw new Error("should return no appointments")
    })
})
