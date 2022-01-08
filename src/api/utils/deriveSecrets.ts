// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { b642buf, buf2b64, str2ab } from "./conversion";

// salt for the key derivation (public information)
export const salt = b642buf(
    "tlsfpYaKiH/WZUnWkoeE2g==" // 16 bytes
);

export const deriveSecrets = async (
    key: ArrayBuffer,
    length: number,
    rounds: number
) => {
    const baseKey = await crypto.subtle.importKey("raw", key, "HKDF", false, [
        "deriveKey",
        "deriveBits",
    ]);

    const secrets = [];

    for (let i = 0; i < rounds; i++) {
        const secret = await crypto.subtle.deriveBits(
            {
                name: "HKDF",
                hash: "SHA-256",
                salt: salt, // this is public information
                info: str2ab(i.toString()), // we use a number string here for simplicity
            },
            baseKey,
            length * 8
        );

        secrets.push(buf2b64(secret));
    }

    return secrets;
};
