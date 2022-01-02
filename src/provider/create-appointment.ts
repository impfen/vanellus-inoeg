// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Provider } from "./"
import { randomBytes } from "../crypto"
import { Appointment, Slot } from "../interfaces"

export function createSlot() {
    return {
        open: true,
        id: randomBytes(32), // where the user can submit his confirmation
        status: randomBytes(32), // where the user can get the appointment status
        cancel: randomBytes(32), // where the user can cancel his confirmation
    }
}

/**
 * creates an initial Appointment object
 * @param duration defines the length of the appointment in minutes
 * @param vaccine defines the vaccine offered at the appointment
 * @param slotN defines the number of people that can be vaccinated
 * @param timestamp defines the time of the appointment
 */

export async function createAppointment(
    this: Provider,
    duration: number,
    vaccine: string,
    slotN: number,
    timestamp: string
) {
    const slotData: Slot[] = []
    for (let i = 0; i < slotN; i++) {
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
        properties: { vaccine: vaccine },
        id: randomBytes(32),
        publicKey: "",
        slotData: slotData,
    } as Appointment
}
