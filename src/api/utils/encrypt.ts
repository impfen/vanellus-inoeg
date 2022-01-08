// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { AESData, ECDHData, KeyPair } from "../interfaces";
import { ab2str, b642buf, buf2b64, str2ab } from "./conversion";
import { salt } from "./deriveSecrets";
import { generateECDHKeyPair } from "./generateKey";

export async function aesEncrypt(
    rawData: string,
    secret: ArrayBuffer
): Promise<AESData> {
    const data = str2ab(rawData);

    const secretKey = await crypto.subtle.importKey(
        "raw",
        secret,
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    const symmetricKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", hash: "SHA-256", salt: salt, iterations: 100000 },
        secretKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = (await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            tagLength: 128,
            iv: iv,
        },
        symmetricKey,
        data
    )) as Buffer;

    return {
        iv: buf2b64(iv),
        data: buf2b64(encryptedData),
    };
}

export async function aesDecrypt(
    data: AESData,
    secret: ArrayBuffer
): Promise<string> {
    const secretKey = await crypto.subtle.importKey(
        "raw",
        secret,
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    const symmetricKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", hash: "SHA-256", salt: salt, iterations: 100000 },
        secretKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );

    const decryptedData = (await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            tagLength: 128,
            iv: b642buf(data.iv),
        },
        symmetricKey,
        b642buf(data.data)
    )) as Buffer;

    return ab2str(decryptedData);
}

export async function ecdhEncrypt(
    rawData: string,
    keyPair: KeyPair,
    publicKeyData: string
): Promise<ECDHData> {
    const data = str2ab(rawData);

    const publicKey = await crypto.subtle.importKey(
        "spki",
        b642buf(publicKeyData),
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
    );

    const privateKey = await crypto.subtle.importKey(
        "jwk",
        keyPair.privateKey,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey"]
    );

    const symmetricKey = await crypto.subtle.deriveKey(
        {
            name: "ECDH",
            public: publicKey,
        },
        privateKey,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = (await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            tagLength: 128,
            iv: iv,
        },
        symmetricKey,
        data
    )) as Buffer;

    return {
        iv: buf2b64(iv),
        data: buf2b64(encryptedData),
        publicKey: keyPair.publicKey,
    };
}

export async function ephemeralECDHEncrypt(
    rawData: string,
    publicKeyData: string
): Promise<[ECDHData, JsonWebKey]> {
    const data = str2ab(rawData);

    // we generate an ephemeral ECDH key pair
    const ephemeralKeyPair = await generateECDHKeyPair();

    const publicKey = await crypto.subtle.importKey(
        "spki",
        b642buf(publicKeyData),
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
    );

    const privateKey = await crypto.subtle.importKey(
        "jwk",
        ephemeralKeyPair.privateKey,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey"]
    );

    const symmetricKey = await crypto.subtle.deriveKey(
        {
            name: "ECDH",
            public: publicKey,
        },
        privateKey,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = (await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            tagLength: 128,
            iv: iv,
        },
        symmetricKey,
        data
    )) as Buffer;

    // we return the data and the public ephemeral key (which the receiver needs to derive
    // the symmetric key using his/her private key)
    return [
        {
            iv: buf2b64(iv),
            data: buf2b64(encryptedData),
            publicKey: ephemeralKeyPair.publicKey,
        },
        ephemeralKeyPair.privateKey,
    ];
}

export async function ecdhDecrypt(
    ecdhData: ECDHData,
    privateKeyData: JsonWebKey
) {
    const privateKey = await crypto.subtle.importKey(
        "jwk",
        privateKeyData,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey"]
    );

    const publicKey = await crypto.subtle.importKey(
        "spki",
        b642buf(ecdhData.publicKey),
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
    );

    const symmetricKey = await crypto.subtle.deriveKey(
        {
            name: "ECDH",
            public: publicKey,
        },
        privateKey,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );

    const decryptedData = (await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            tagLength: 128,
            iv: b642buf(ecdhData.iv),
        },
        symmetricKey,
        b642buf(ecdhData.data)
    )) as Buffer;

    return ab2str(decryptedData);
}
