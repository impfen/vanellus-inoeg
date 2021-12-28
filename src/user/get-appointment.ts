// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import {
    Status,
    Result,
    Error,
    Appointment,
    PublicProviderData,
} from "../interfaces"
import { verify } from "../crypto"
import { User } from "./"

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

async function verifyProviderData(item: any) {
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

interface GetAppointmentResult extends Result {
    appointment: Appointment
    provider: PublicProviderData
}

interface GetAppointmentsParams {
    id: string
    providerID: string
}

export async function getAppointment(
    this: User,
    { id, providerID }: GetAppointmentsParams
): Promise<GetAppointmentResult | Error> {
    const response = await this.backend.appointments.getAppointment({
        id: id,
        providerID: providerID,
    })

    if ("code" in response)
        return {
            status: Status.Failed,
            error: response,
        }

    response.provider.json = await verifyProviderData(response)
    // we copy the ID for convenience
    response.provider.json!.id = response.provider.id

    const signedAppointment = response.appointments[0]

    const appointment: Appointment = await verifyAppointment(
        signedAppointment,
        response
    )
    for (const slot of appointment.slotData) {
        if (signedAppointment.bookedSlots!.some((id: any) => id === slot.id))
            slot.open = false
        else slot.open = true
    }

    return {
        status: Status.Succeeded,
        provider: response.provider.json!,
        appointment: appointment,
    }
}
