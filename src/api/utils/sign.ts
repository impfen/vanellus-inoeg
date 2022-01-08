// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { SignedData } from "../interfaces";
import { buf2b64, str2ab } from "./conversion";

export const sign = async (
    rawData: string,
    privateKeyData: JsonWebKey,
    publicKeyData: string
) => {
    // we import the key data
    const privateKey = await crypto.subtle.importKey(
        "jwk",
        privateKeyData,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign"]
    );

    const result = await crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        privateKey,
        str2ab(rawData)
    );

    const signedData: SignedData = {
        signature: buf2b64(result),
        data: rawData,
        publicKey: publicKeyData,
    };

    return signedData;
};
