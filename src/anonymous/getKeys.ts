// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Actor } from "../actor"
import { PublicKeys, Result, Error, Status } from "../interfaces"

/**
 * Fetch public keys from the server
 */

interface PublicKeysResult extends Result {
    keys: PublicKeys
}

export async function getKeys(this: Actor): Promise<PublicKeysResult | Error> {
    const result = await this.backend.appointments.getKeys()

    if ("code" in result)
        return {
            status: Status.Failed,
            error: result,
        }

    return {
        status: Status.Succeeded,
        keys: result,
    }
}
