// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Actor } from "../actor"
import { PublicKeys, Result, Status } from "../interfaces"
import { VanellusError } from "../errors"

/**
 * Fetch public keys from the server
 */

interface PublicKeysResult extends Result {
    keys: PublicKeys
}

export async function getKeys(this: Actor): Promise<PublicKeysResult | VanellusError> {
    const result = await this.backend.appointments.getKeys()

    if (result instanceof VanellusError) {
        return result
    }

    return {
        status: Status.Succeeded,
        keys: result,
    }
}
