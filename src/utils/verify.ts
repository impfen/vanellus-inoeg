// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { base64ToBuffer, stringToArrayBuffer } from ".";
import { UnexpectedError } from "../errors";
import type { SignedData } from "../interfaces";

/**
 * Verifies the signature of a given string with one or more keys
 *
 * @throws UnexpectedError if the validation of the signature failed for all given keys
 *
 * @returns true
 */
export const verify = async (
    keys: string | string[],
    signedData: SignedData
) => {
    const signature = base64ToBuffer(signedData.signature);
    const data = stringToArrayBuffer(signedData.data);

    for (const keyData of Array.isArray(keys) ? keys : [keys]) {
        const keyDataBuffer = base64ToBuffer(keyData);

        try {
            // we import the key data
            const cryptoKey = await crypto.subtle.importKey(
                "spki",
                keyDataBuffer,
                { name: "ECDSA", namedCurve: "P-256" },
                false,
                ["verify"]
            );

            const isVerified = await crypto.subtle.verify(
                { name: "ECDSA", hash: "SHA-256" },
                cryptoKey,
                signature,
                data
            );

            if (true === isVerified) {
                return true;
            }
        } catch (error) {
            continue;
        }
    }

    // no key signature was valid
    throw new UnexpectedError("Could not verify signature");
};
