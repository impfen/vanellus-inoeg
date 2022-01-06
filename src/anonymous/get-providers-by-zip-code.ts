// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Actor } from "../actor"
import { VanellusError } from "../errors"
import { Optional } from "../helpers/optional"
import { parseUntrustedJSON } from "../helpers/parseUntrustedJSON"
import {
    Appointment,
    BookedSlot,
    PublicProviderData,
    Result,
    Status,
    VerifiedProviderAppointments,
} from "../interfaces"

export interface ProvidersByZipCodeResult extends Result {
    providers: PublicProviderData[]
}

export async function getProvidersByZipCode(
    this: Actor,
    zipFrom: string,
    zipTo: string
): Promise<ProvidersByZipCodeResult | VanellusError> {

    const response = await this.backend.appointments.getProvidersByZipCode({
        zipFrom: zipFrom,
        zipTo: zipTo,
    })
    if (response instanceof VanellusError) return response

    const providers: PublicProviderData[] = []

    for (const p of response) {
        const jsonProvider = parseUntrustedJSON<PublicProviderData>(p.data)
        if (!jsonProvider) continue
        jsonProvider.id = p.id
        providers.push(jsonProvider)
    }

    return {
        status: Status.Succeeded,
        providers: providers,
    }
}
