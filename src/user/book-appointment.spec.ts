// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Status } from "../interfaces"
import { equal } from "assert"
import { formatDatetime, formatDate } from "../helpers/time"
import {
    backend,
    adminKeys,
    resetDB,
    mediator,
    verifiedProvider,
} from "../testing/fixtures"
import { User } from "./"

describe("User.bookAppointment()", function () {
    it("we should be able to book an appointment", async function () {
        const be = backend()
        const keys = await adminKeys()
        await resetDB(be, keys)
        const med = await mediator(be, keys)
        const vp = await verifiedProvider(be, keys, med)

        let date = new Date()

        // tomorrow 3 pm

        date.setDate(date.getDate() + 1)
        date.setHours(15)
        date.setMinutes(0)
        date.setSeconds(0)
        date.setMilliseconds(0)

        var app = await vp.createAppointment(
            15,
            "moderna",
            5,
            date.toISOString()
        )
        const publishResult = await vp.publishAppointments([app])

        if (publishResult.status !== Status.Succeeded)
            throw new Error("cannot create appointment")

        const user = new User("main", be)
        // we generate a secret etc.
        await user.initialize()
        // we set the queue data
        user.queueData = {
            zipCode: "10707",
        }
        // we set the contact data
        user.contactData = {
            name: "Max Mustermann",
        }
        const tokenResult = await user.getToken({})

        if (tokenResult.status !== Status.Succeeded)
            throw new Error("cannot get token")

        const fromDate = new Date()
        // 24 hours in the future
        const toDate = new Date(new Date().getTime() + 48 * 60 * 60 * 1000)

        const getResult = await user.getAppointments({
            from: formatDatetime(fromDate),
            to: formatDatetime(toDate),
            zipCode: user.queueData!.zipCode,
        })

        if (getResult.status !== Status.Succeeded)
            throw new Error("should not fail")

        if (getResult.appointments.length !== 1)
            throw new Error("should return one appointment")

        const bookResult = await user.bookAppointment(
            getResult.appointments[0].appointments[0],
            getResult.appointments[0].provider
        )

        if (bookResult.status !== Status.Succeeded)
            throw new Error("should not fail")

        let apptsResult = await vp.getAppointments({
            from: formatDatetime(fromDate),
            to: formatDatetime(toDate),
        })

        if (apptsResult.status !== Status.Succeeded)
            throw new Error("should be able to get appointments")

        if (
            apptsResult.appointments[0].bookings![0].data.userToken.code !==
            user.secret!.slice(0, 4)
        )
            throw new Error("booking code does not match")

        const cancelResult = await user.cancelAppointment(
            bookResult.acceptedAppointment
        )

        if (cancelResult.status !== Status.Succeeded)
            throw new Error("cannot cancel appointment")

        apptsResult = await vp.getAppointments({
            from: formatDatetime(fromDate),
            to: formatDatetime(toDate),
        })

        if (apptsResult.status !== Status.Succeeded)
            throw new Error("should be able to get appointments")

        if (apptsResult.appointments[0].bookings!.length !== 0)
            throw new Error("excepted no more bookings")
    })
})
