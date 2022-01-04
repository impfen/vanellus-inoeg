// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { randomBytes } from "../crypto"
import { Appointment, Slot } from "../interfaces"

/**
 * Creates a new appointment object.
 * @param duration the duration of the appointment in minutes
 * @param properties additional properties for the appointment like the
 * vaccine offered
 * @param slots the number of bookable slots
 * @param timestamp the time of the appointment as an ISO string
 */

export function createAppointment(
    duration: number,
    properties: { [Key: string]: any },
    slots: number,
    timestamp: string
): Appointment {
    const slotData: Slot[] = []
    for (let i = 0; i < slots; i++) {
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
