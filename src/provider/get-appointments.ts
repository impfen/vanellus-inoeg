// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { randomBytes, sign, verify, ecdhDecrypt } from "../crypto"
import {
    Status,
    Appointment,
    Slot,
    SignedAppointment,
    Result,
    Error,
} from "../interfaces"
import { Provider } from "./"

interface GetAppointmentsResult extends Result {
    appointments: Appointment[]
}

  /**
   * Retrieves the appointments that belong to the provider from the backend
   * @param from earliest timestamp for the returned appointments as an ISO
   * string
   * @param to time latest timestamp for the returned appointments as an ISO
   * string
   */

export async function getAppointments(
    this: Provider,
    { from, to }: { from: string; to: string }
): Promise<GetAppointmentsResult | Error> {
    const decryptBookings = async (bookings: any) => {
        for (const booking of bookings) {
            const decryptedData = await ecdhDecrypt(
                booking.encryptedData,
                this.keyPairs!.encryption.privateKey
            )
            const dd = JSON.parse(decryptedData!)
            booking.data = dd
        }
        return bookings
    }

    const response = await this.backend.appointments.getAppointments(
        { from: from, to: to },
        this.keyPairs!.signing
    )

    if (!(response instanceof Array))
        return {
            status: Status.Failed,
            error: response,
        }

    const newAppointments: Appointment[] = []

    for (const appointment of response) {
        const verified = await verify(
            [this.keyPairs!.signing.publicKey],
            appointment
        )
        if (!verified) {
            continue
        }
        const appData = JSON.parse(appointment.data)

        // this appointment was loaded already (should not happen)
        if (newAppointments.find((app) => app.id === appData.id)) {
            continue
        }

        const newAppointment: Appointment = {
            updatedAt: appData.updatedAt,
            timestamp: appData.timestamp,
            duration: appData.duration,
            slotData: appData.slotData,
            publicKey: appData.publicKey,
            properties: appData.properties,
            bookings: await decryptBookings(appointment.bookings || []),
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
