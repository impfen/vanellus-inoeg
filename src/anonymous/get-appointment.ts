// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Actor } from "../actor"
import { ErrorCode, VanellusError } from "../errors"
import { Optional } from "../helpers/optional"
import { parseUntrustedJSON } from "../helpers/parseUntrustedJSON"
import {
    Appointment,
    BookedSlot,
    ProviderAppointments,
    PublicProviderData,
    Result,
    Status,
} from "../interfaces"

async function verifyAppointment(
    appointment: any,
    item: any
): Promise<Optional<Appointment>> {
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
    return parseUntrustedJSON<Appointment>(appointment.data)
}

async function verifyProviderData(
    item: ProviderAppointments
): Promise<Optional<PublicProviderData>> {
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
    return parseUntrustedJSON<PublicProviderData>(item.provider.data)
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
    this: Actor,
    { id, providerID }: GetAppointmentsParams
): Promise<GetAppointmentResult | VanellusError> {
    const response = await this.backend.appointments.getAppointment({
        id: id,
        providerID: providerID,
    })

    if (response instanceof VanellusError) return response

    const jsonProvider = await verifyProviderData(response)
    if (!jsonProvider)
        return new VanellusError(ErrorCode.DataMissing, "invalid provider")

    response.provider.json = jsonProvider
    // we copy the ID for convenience
    response.provider.json.id = response.provider.id

    const signedAppointment = response.appointments[0]

    const appointment = await verifyAppointment(signedAppointment, response)
    if (!appointment)
        return new VanellusError(ErrorCode.DataMissing, "invalid appointment")

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

    return {
        status: Status.Succeeded,
        provider: response.provider.json,
        appointment: appointment,
    }
}
