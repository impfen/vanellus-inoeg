// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ErrorCode, UnexpectedError } from "../errors"
import { buf2b64, str2ab } from "../helpers/conversion"
import { SignedData } from "../interfaces"

export async function sign(
    privateKeyData: JsonWebKey,
    rawData: string,
    publicKeyData: string
): Promise<SignedData> {
    const data = str2ab(rawData)
    try {
        // we import the key data
        const privateKey = await crypto.subtle.importKey(
            "jwk",
            privateKeyData,
            { name: "ECDSA", namedCurve: "P-256" },
            false,
            ["sign"]
        )

        const result = await crypto.subtle.sign(
            { name: "ECDSA", hash: "SHA-256" },
            privateKey,
            data
        )

        return {
            signature: buf2b64(result),
            data: rawData,
            publicKey: publicKeyData,
        }
    } catch (e) {
        console.error(e)
        throw new UnexpectedError(ErrorCode.Crypto, e)
    }
}
