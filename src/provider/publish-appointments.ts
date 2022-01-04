// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { sign } from "../crypto"
import { ErrorCode, VanellusError } from "../errors"
import { Appointment, Result, SignedData, Slot, Status } from "../interfaces"
import { Provider } from "./"

/**
 * Upload new or changed appointments to the server.
 * @param apps an array of appointment objects
 */

export async function publishAppointments(
    this: Provider,
    apps: Appointment[]
): Promise<Result | VanellusError> {
    if (!this.keyPairs) return new VanellusError(ErrorCode.KeysMissing)

    const signedAppointments: SignedData[] = []
    const relevantAppointments = apps.filter(
        (oa: Appointment) =>
            new Date(oa.timestamp) >
                new Date(new Date().getTime() - 1000 * 60 * 60 * 4) &&
            oa.modified
    )

    for (const appointment of relevantAppointments) {
        const convertedAppointment = {
            id: appointment.id,
            duration: appointment.duration,
            timestamp: appointment.timestamp,
            publicKey: this.keyPairs.encryption.publicKey,
            properties: appointment.properties,
            slotData: appointment.slotData.map((sl: Slot) => ({
                id: sl.id,
            })),
        }

        // we sign each appointment individually so that the client can
        // verify that they've been posted by a valid provider
        const signedAppointment = await sign(
            this.keyPairs.signing.privateKey,
            JSON.stringify(convertedAppointment),
            this.keyPairs.signing.publicKey
        )

        signedAppointments.push(signedAppointment)
    }

    if (signedAppointments.length === 0)
        return {
            status: Status.Succeeded,
        }

    const result = await this.backend.appointments.publishAppointments(
        {
            appointments: signedAppointments,
        },
        this.keyPairs.signing
    )

    if (result instanceof VanellusError) return result

    return {
        status: Status.Succeeded,
    }
}
