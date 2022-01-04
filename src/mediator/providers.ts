// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ecdhDecrypt } from "../crypto"
import { ErrorCode, VanellusError } from "../errors"
import { parseUntrustedJSON } from "../helpers/parseUntrustedJSON"
import {
    DecryptedProviderData,
    EncryptedProviderData,
    ProviderData,
    Result,
    Status,
} from "../interfaces"
import { Mediator } from "./"

export interface ProvidersResult extends Result {
    providers: DecryptedProviderData[]
}

async function decryptProviderData(
    encData: EncryptedProviderData[],
    privKey: JsonWebKey
): Promise<DecryptedProviderData[]> {
    const providerData: DecryptedProviderData[] = []
    for (const pd of encData) {
        const decryptedData = await ecdhDecrypt(pd.encryptedData, privKey)
        if (decryptedData instanceof VanellusError) continue

        // to do: verify provider data!
        const parsedData: DecryptedProviderData = {
            encryptedData: pd.encryptedData,
            data: parseUntrustedJSON(decryptedData) as ProviderData,
        }

        if (parsedData) providerData.push(parsedData)
    }

    return providerData
}

export async function pendingProviders(
    this: Mediator
): Promise<ProvidersResult | VanellusError> {
    if (!this.keyPairs) {
        return new VanellusError(ErrorCode.KeysMissing)
    }

    const encryptedProviderData =
        await this.backend.appointments.getPendingProviderData(
            {},
            this.keyPairs.signing
        )

    if (encryptedProviderData instanceof VanellusError)
        return encryptedProviderData

    const providerData = await decryptProviderData(
        encryptedProviderData,
        this.keyPairs.provider.privateKey
    )

    return {
        status: Status.Succeeded,
        providers: providerData,
    }
}

export async function verifiedProviders(
    this: Mediator
): Promise<ProvidersResult | VanellusError> {
    if (!this.keyPairs) {
        return new VanellusError(ErrorCode.KeysMissing)
    }

    const encryptedProviderData =
        await this.backend.appointments.getVerifiedProviderData(
            {},
            this.keyPairs.signing
        )

    if (encryptedProviderData instanceof VanellusError)
        return encryptedProviderData

    const providerData = await decryptProviderData(
        encryptedProviderData,
        this.keyPairs.provider.privateKey
    )

    return {
        status: Status.Succeeded,
        providers: providerData,
    }
}
