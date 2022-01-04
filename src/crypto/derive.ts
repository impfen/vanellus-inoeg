// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ErrorCode, UnexpectedError } from "../errors"
import { buf2b64, str2ab } from "../helpers/conversion"
import { salt } from "./token"

export async function deriveSecrets(
    key: ArrayBuffer,
    len: number,
    n: number
): Promise<string[]> {
    try {
        const baseKey = await crypto.subtle.importKey(
            "raw",
            key,
            "HKDF",
            false,
            ["deriveKey", "deriveBits"]
        )

        const secrets = []
        for (let i = 0; i < n; i++) {
            const secret = await crypto.subtle.deriveBits(
                {
                    name: "HKDF",
                    hash: "SHA-256",
                    salt: salt, // this is public information
                    info: str2ab(`${i}`), // we use a number string here for simplicity
                },
                baseKey,
                len * 8
            )
            secrets.push(buf2b64(secret))
        }
        return secrets
    } catch (e) {
        console.error(e)
        throw new UnexpectedError(ErrorCode.Crypto, e)
    }
}
