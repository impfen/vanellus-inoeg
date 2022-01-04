// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ephemeralECDHEncrypt, sign } from "../crypto"
import { ErrorCode, VanellusError } from "../errors"
import { DecryptedProviderData, Result, Status } from "../interfaces"
import { Mediator } from "./"

export async function confirmProvider(
    this: Mediator,
    providerData: DecryptedProviderData
): Promise<Result | VanellusError> {
    if (!this.keyPairs) {
        return new VanellusError(ErrorCode.KeysMissing)
    }

    if (!providerData.data) {
        return new VanellusError(
            ErrorCode.DataMissing,
            "Provider data is missing"
        )
    }

    const data = providerData.data

    const keyHashesData = {
        signing: data.publicKeys.signing,
        encryption: data.publicKeys.encryption,
        queueData: {
            zipCode: data.zipCode,
            accessible: data.accessible,
        },
    }

    const keysJSONData = JSON.stringify(keyHashesData)

    const publicProviderData = {
        name: data.name,
        street: data.street,
        city: data.city,
        zipCode: data.zipCode,
        website: data.website,
        description: data.description,
    }

    const publicProviderJSONData = JSON.stringify(publicProviderData)

    const signedKeyData = await sign(
        this.keyPairs.signing.privateKey,
        keysJSONData,
        this.keyPairs.signing.publicKey
    )

    // this will be stored for the provider, so we add the public key data
    const signedProviderData = await sign(
        this.keyPairs.signing.privateKey,
        JSON.stringify(data),
        this.keyPairs.signing.publicKey
    )

    // this will be stored for the general public
    const signedPublicProviderData = await sign(
        this.keyPairs.signing.privateKey,
        publicProviderJSONData,
        this.keyPairs.signing.publicKey
    )

    const fullData = {
        signedData: signedProviderData,
        signedPublicData: signedPublicProviderData,
    }

    // we encrypt the data with the public key supplied by the provider
    const [confirmedProviderData] = await ephemeralECDHEncrypt(
        JSON.stringify(fullData),
        providerData.encryptedData.publicKey
    )

    const signedConfirmedProviderData = await sign(
        this.keyPairs.signing.privateKey,
        JSON.stringify(confirmedProviderData),
        this.keyPairs.signing.publicKey
    )

    const result = await this.backend.appointments.confirmProvider(
        {
            confirmedProviderData: signedConfirmedProviderData,
            publicProviderData: signedPublicProviderData,
            signedKeyData: signedKeyData,
        },
        this.keyPairs.signing
    )

    if (result instanceof VanellusError) return result

    return {
        status: Status.Succeeded,
    }
}
