// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Dayjs } from "dayjs"

export function getMonday(d: string | Date) {
    d = new Date(d)
    const day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1) // adjust when day is sunday
    return new Date(d.setDate(diff))
}

// https://stackoverflow.com/questions/23593052/format-javascript-date-as-yyyy-mm-dd
export function formatDate(date: string | Date) {
    const d = new Date(date)
    let month = "" + (d.getMonth() + 1)
    let day = "" + d.getDate()
    const year = d.getFullYear()

    if (month.length < 2) month = "0" + month
    if (day.length < 2) day = "0" + day

    return [year, month, day].join("-")
}

export function formatDatetime(timestamp: string | Date | Dayjs) {
    if (typeof timestamp === "object") {
        return timestamp.toISOString()
    } else {
        const d = new Date(timestamp)
        return d.toISOString()
    }
}

// https://stackoverflow.com/questions/23593052/format-javascript-date-as-yyyy-mm-dd
export function formatTime(date: string | Date) {
    let d = new Date(date),
        hours = "" + d.getHours(),
        minutes = "" + d.getMinutes()

    if (hours.length < 2) hours = "0" + hours
    if (minutes.length < 2) minutes = "0" + minutes

    return [hours, minutes].join(":")
}
