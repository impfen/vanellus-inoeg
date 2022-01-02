// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ErrorCode, UnexpectedError, VanellusError } from '../errors'
import { b642buf, buf2b64, str2ab } from "../helpers/conversion"
import { SignedData } from "../interfaces"

export async function sign(
    keyData: JsonWebKey,
    rawData: string,
    publicKeyData: string
): Promise<SignedData> {
    const data = str2ab(rawData)
    try {
        // we import the key data
        const key = await crypto.subtle.importKey(
            "jwk",
            keyData,
            { name: "ECDSA", namedCurve: "P-256" },
            false,
            ["sign"]
        )

        const result = await crypto.subtle.sign(
            { name: "ECDSA", hash: "SHA-256" },
            key,
            data
        )
        const d: SignedData = { signature: buf2b64(result), data: rawData }
        if (publicKeyData !== undefined) d.publicKey = publicKeyData
        return d
    } catch (e) {
        console.error(e)
        throw new UnexpectedError(ErrorCode.Crypto, e)
    }
}
