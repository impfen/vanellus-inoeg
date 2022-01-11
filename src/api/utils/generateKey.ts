// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ApiError } from "../errors";
import { KeyPair } from "../interfaces";
import { bufferToBase64 } from "./conversion";

export async function generateSymmetricKey(): Promise<string> {
    const key = await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );

    const keyBytes = await crypto.subtle.exportKey("raw", key);

    return bufferToBase64(keyBytes);
}

export async function generateECDSAKeyPair(): Promise<KeyPair> {
    const key = await crypto.subtle.generateKey(
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["sign", "verify"]
    );

    if (!key.publicKey || !key.privateKey) {
        throw new ApiError("key generation failed");
    }

    const pubKey = await crypto.subtle.exportKey("spki", key.publicKey);
    const privKey = await crypto.subtle.exportKey("jwk", key.privateKey);

    return { publicKey: bufferToBase64(pubKey), privateKey: privKey };
}

export async function generateECDHKeyPair(): Promise<KeyPair> {
    const key = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"]
    );

    if (!key.publicKey || !key.privateKey) {
        throw new ApiError("key generation failed");
    }

    const pubKey = await crypto.subtle.exportKey("spki", key.publicKey);
    const privKey = await crypto.subtle.exportKey("jwk", key.privateKey);

    return { publicKey: bufferToBase64(pubKey), privateKey: privKey };
}
