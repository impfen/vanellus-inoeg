// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ErrorCode, VanellusError } from '../errors'
import { parseUntrustedJSON } from '../helpers/parseUntrustedJSON'
import { ecdhDecrypt } from "../crypto"
import {
    Result,
    Status,
    ConfirmedProviderData,
    ProviderData,
} from "../interfaces"
import { Provider } from "./"

interface CheckDataResult extends Result {
    data: ProviderData
}

/**
 * Tests whether the provider can successfully authenticate against the
 * backend. This may be used as a test whether the provider is verified by a
 * mediator.
 */

export async function checkData(
    this: Provider,
): Promise<CheckDataResult | VanellusError> {
    if (!this.keyPairs) return new VanellusError(ErrorCode.KeysMissing)

    const response = await this.backend.appointments.checkProviderData(
        {},
        this.keyPairs.signing
    )

    if (response instanceof VanellusError) return response
        
    // to do: check signature
    const decryptedJSONData = await ecdhDecrypt(
        JSON.parse(response.data),
        this.keyPairs.data.privateKey
    )

    if (decryptedJSONData instanceof VanellusError) {
        // can't decrypt
        this.verifiedData = null
        return decryptedJSONData
    }

    const decryptedData: ProviderData = parseUntrustedJSON(decryptedJSONData)
    if (!decryptedData) {
        this.verifiedData = null
        return new VanellusError(ErrorCode.DataMissing, "invalid json data")
    }

    this.verifiedData = decryptedData
    // to do: check signed keys as well
    return { status: Status.Succeeded, data: decryptedData }
}
