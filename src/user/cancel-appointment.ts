// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ErrorCode, VanellusError } from '../errors'
import { Result, Status, AcceptedAppointment } from "../interfaces"
import { User } from "./"

export async function cancelAppointment(
    this: User,
    acceptedAppointment: AcceptedAppointment
): Promise<Result | VanellusError> {
    if (!this.tokenData) return new VanellusError(ErrorCode.DataMissing, "token data is missing")

    const result = await this.backend.appointments.cancelAppointment(
        {
            id: acceptedAppointment.appointment.id,
            signedTokenData: this.tokenData.signedToken,
            providerID: acceptedAppointment.provider.id,
        },
        this.tokenData.keyPairs.signing
    )

    if (result instanceof VanellusError) return result

    return {
        status: Status.Succeeded,
    }
}
