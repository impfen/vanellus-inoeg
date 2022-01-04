// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ephemeralECDHEncrypt } from "../crypto"
import { ErrorCode, VanellusError } from "../errors"
import {
    AcceptedAppointment,
    Appointment,
    PublicProviderData,
    Result,
    Status,
} from "../interfaces"
import { User } from "./"

export interface BookAppointmentResult extends Result {
    acceptedAppointment: AcceptedAppointment
}

export async function bookAppointment(
    this: User,
    appointment: Appointment,
    provider: PublicProviderData
): Promise<BookAppointmentResult | VanellusError> {
    if (!this.tokenData)
        return new VanellusError(ErrorCode.DataMissing, "token data is missing")

    const providerData = {
        signedToken: this.tokenData.signedToken,
        userToken: this.tokenData.userToken,
    }

    const encryptedDataAndPublicKey = await ephemeralECDHEncrypt(
        JSON.stringify(providerData),
        appointment.publicKey
    )

    // we don't care about the ephmeral key
    const [encryptedData] = encryptedDataAndPublicKey

    const response = await this.backend.appointments.bookAppointment(
        {
            id: appointment.id,
            providerID: provider.id,
            encryptedData: encryptedData,
            signedTokenData: this.tokenData.signedToken,
        },
        this.tokenData.keyPairs.signing
    )
    if (response instanceof VanellusError) return response

    const acceptedAppointment: AcceptedAppointment = {
        appointment: appointment,
        provider: provider,
        booking: response,
    }

    // we store the information about the offer which we've accepted
    this.acceptedAppointment = acceptedAppointment

    return {
        status: Status.Succeeded,
        acceptedAppointment: acceptedAppointment,
    }
}
