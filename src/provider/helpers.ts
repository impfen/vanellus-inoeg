// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { randomBytes } from "../crypto"
import { Slot, Appointment } from "../interfaces"

export function createAppointment(
    duration: number,
    properties: { [Key: string]: any },
    slots: number,
    timestamp: string
): Appointment {
    var slotData: Slot[] = []
    for (var i = 0; i < slots; i++) {
        slotData[i] = {
            id: randomBytes(32),
            open: true,
        }
    }
    const now = new Date().toISOString()

    return {
        bookings: [],
        updatedAt: now,
        modified: true,
        timestamp: timestamp,
        duration: duration,
        properties: properties,
        id: randomBytes(32),
        publicKey: "",
        slotData: slotData,
    }
}
