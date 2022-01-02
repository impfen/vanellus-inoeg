// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import {
    Status,
    Result,
    Appointment,
    VerifiedProviderAppointments,
    BookedSlot,
    PublicProviderData,
} from "../interfaces"
import { verify } from "../crypto"
import { User } from "./"
import { VanellusError } from '../errors'

async function verifyAppointment(appointment: any, item: any) {
    // to do: verify based on key chain
    /*
    let found = false;
    for (const providerKeys of keys.lists.providers) {
        if (providerKeys.json.signing === appointment.publicKey) {
            found = true;
            break;
        }
    }
    if (!found) throw 'invalid key';
    const result = await verify([appointment.publicKey], appointment);
    if (!result) throw 'invalid signature';
    */
    return JSON.parse(appointment.data)
}

async function verifyProviderData(item: any): Promise<PublicProviderData> {
    // to do: verify based on key chain
    /*
    let found = false;
    if (item.keyChain.mediator.signin)
    for (const mediatorKeys of keys.lists.mediators) {
        if (mediatorKeys.json.signing === providerData.publicKey) {
            found = true;
            break;
        }
    }
    if (!found) throw 'invalid key';
    const result = await verify([item.provider.publicKey], providerData);
    if (!result) throw 'invalid signature';
    */
    return JSON.parse(item.provider.data)
}

export interface GetAppointmentsResult extends Result {
    appointments: VerifiedProviderAppointments[]
}

export interface GetAppointmentsParams {
    from: string
    to: string
    zipCode: string
}

export async function getAppointments(
    this: User,
    { from, to, zipCode }: GetAppointmentsParams
): Promise<GetAppointmentsResult | VanellusError> {
    const response = await this.backend.appointments.getAppointmentsByZipCode({
        zipCode: zipCode,
        from: from,
        to: to,
    })
    if (response instanceof VanellusError) return response

    const verifiedAppointments: VerifiedProviderAppointments[] = []

    for (const item of response) {
        item.provider.json = await verifyProviderData(item)
        // we copy the ID for convenience
        item.provider.json.id = item.provider.id
        const verifiedProviderAppointments: Appointment[] = []
        for (const signedAppointment of item.appointments) {
            const appointment: Appointment = await verifyAppointment(
                signedAppointment,
                item
            )
            for (const slot of appointment.slotData) {
                if (
                    signedAppointment.bookedSlots?.some(
                        (aslot: BookedSlot) => aslot.id === slot.id
                    )
                ) {
                    slot.open = false
                } else {
                    slot.open = true
                }
            }
            verifiedProviderAppointments.push(appointment)
        }
        verifiedAppointments.push({
            provider: item.provider.json,
            appointments: verifiedProviderAppointments,
        } as VerifiedProviderAppointments)
    }

    verifiedAppointments.sort((a, b) =>
        a.provider.name > b.provider.name ? 1 : -1
    )

    return {
        status: Status.Succeeded,
        appointments: verifiedAppointments,
    }
}
