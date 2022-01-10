// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ecdhDecrypt, verify } from "../crypto"
import { ErrorCode, VanellusError } from "../errors"
import { parseUntrustedJSON } from "../helpers/parseUntrustedJSON"
import { Appointment, Booking, Result, Status } from "../interfaces"
import { Provider } from "./"

export interface GetAppointmentsResult extends Result {
    appointments: Appointment[]
}

async function decryptBookings(bookings: Booking[], privKey: JsonWebKey) {
    for (const booking of bookings) {
        const decryptedData = await ecdhDecrypt(booking.encryptedData, privKey)
        if (decryptedData instanceof VanellusError) continue
        const dd = parseUntrustedJSON(decryptedData)
        if (!dd) continue
        booking.data = dd
    }
    return bookings
}

/**
 * Retrieves the appointments that belong to the provider from the backend
 * @param from earliest timestamp for the returned appointments as an ISO
 * string
 * @param to time latest timestamp for the returned appointments as an ISO
 * string
 */

export async function getProviderAppointments(
    this: Provider,
    { from, to }: { from: string; to: string }
): Promise<GetAppointmentsResult | VanellusError> {
    if (!this.keyPairs) return new VanellusError(ErrorCode.KeysMissing)

    const response = await this.backend.appointments.getAppointments(
        { from: from, to: to },
        this.keyPairs.signing
    )

    if (response instanceof VanellusError) return response

    const newAppointments: Appointment[] = []

    for (const appointment of response.appointments) {
        const verified = await verify(
            [this.keyPairs.signing.publicKey],
            appointment
        )
        if (!verified) {
            continue
        }
        const appData = parseUntrustedJSON<Appointment>(appointment.data)

        // this appointment was loaded already (should not happen)
        if (!appData || newAppointments.find((app) => app.id === appData.id)) {
            continue
        }

        const newAppointment: Appointment = {
            updatedAt: appData.updatedAt,
            timestamp: appData.timestamp,
            duration: appData.duration,
            slotData: appData.slotData,
            publicKey: appData.publicKey,
            properties: appData.properties,
            bookings: await decryptBookings(
                appointment.bookings || [],
                this.keyPairs.encryption.privateKey
            ),
            modified: false,
            id: appData.id,
        }

        newAppointments.push(newAppointment)
    }

    return {
        status: Status.Succeeded,
        appointments: newAppointments,
    }
}
