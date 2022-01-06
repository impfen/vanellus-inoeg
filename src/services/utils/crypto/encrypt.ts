// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { AESData, b642buf, ECDHData, KeyPair } from "../../.."
import { generateECDHKeyPair, salt } from "../../../crypto"
import { ErrorCode, UnexpectedError, VanellusError } from "../../../errors"
import { ab2str, buf2b64, str2ab } from "../../../helpers/conversion"

export async function aesEncrypt(
    rawData: string,
    secret: ArrayBuffer
): Promise<AESData> {
    try {
        const data = str2ab(rawData)

        const secretKey = await crypto.subtle.importKey(
            "raw",
            secret,
            "PBKDF2",
            false,
            ["deriveKey"]
        )

        const symmetricKey = await crypto.subtle.deriveKey(
            { name: "PBKDF2", hash: "SHA-256", salt: salt, iterations: 100000 },
            secretKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        )

        const iv = crypto.getRandomValues(new Uint8Array(12))

        const encryptedData = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                tagLength: 128,
                iv: iv,
            },
            symmetricKey,
            data
        )

        return {
            iv: buf2b64(iv),
            data: buf2b64(encryptedData),
        }
    } catch (e) {
        console.error(e)
        throw new UnexpectedError(ErrorCode.Crypto, e)
    }
}

export async function aesDecrypt(
    data: AESData,
    secret: ArrayBuffer
): Promise<string> {
    try {
        const secretKey = await crypto.subtle.importKey(
            "raw",
            secret,
            "PBKDF2",
            false,
            ["deriveKey"]
        )

        const symmetricKey = await crypto.subtle.deriveKey(
            { name: "PBKDF2", hash: "SHA-256", salt: salt, iterations: 100000 },
            secretKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        )

        const decryptedData = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                tagLength: 128,
                iv: b642buf(data.iv),
            },
            symmetricKey,
            b642buf(data.data)
        )
        return ab2str(decryptedData)
    } catch (e) {
        console.error(e)
        throw new VanellusError(ErrorCode.Crypto, String(e))
    }
}

export async function ecdhEncrypt(
    rawData: string,
    keyPair: KeyPair,
    publicKeyData: string
): Promise<ECDHData> {
    const data = str2ab(rawData)

    try {
        const publicKey = await crypto.subtle.importKey(
            "spki",
            b642buf(publicKeyData),
            { name: "ECDH", namedCurve: "P-256" },
            true,
            []
        )

        const privateKey = await crypto.subtle.importKey(
            "jwk",
            keyPair.privateKey,
            { name: "ECDH", namedCurve: "P-256" },
            false,
            ["deriveKey"]
        )

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
        )

        const iv = crypto.getRandomValues(new Uint8Array(12))

        const encryptedData = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                tagLength: 128,
                iv: iv,
            },
            symmetricKey,
            data
        )

        return {
            iv: buf2b64(iv),
            data: buf2b64(encryptedData),
            publicKey: keyPair.publicKey,
        }
    } catch (e) {
        console.error(e)
        throw new UnexpectedError(ErrorCode.Crypto)
    }
}

export async function ephemeralECDHEncrypt(
    rawData: string,
    publicKeyData: string
): Promise<[ECDHData, JsonWebKey]> {
    const data = str2ab(rawData)

    try {
        // we generate an ephemeral ECDH key pair
        const ephemeralKeyPair = await generateECDHKeyPair()

        const publicKey = await crypto.subtle.importKey(
            "spki",
            b642buf(publicKeyData),
            { name: "ECDH", namedCurve: "P-256" },
            true,
            []
        )
        const privateKey = await crypto.subtle.importKey(
            "jwk",
            ephemeralKeyPair.privateKey,
            { name: "ECDH", namedCurve: "P-256" },
            false,
            ["deriveKey"]
        )

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
        )

        const iv = crypto.getRandomValues(new Uint8Array(12))

        const encryptedData = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                tagLength: 128,
                iv: iv,
            },
            symmetricKey,
            data
        )

        // we return the data and the public ephemeral key (which the receiver needs to derive
        // the symmetric key using his/her private key)
        return [
            {
                iv: buf2b64(iv),
                data: buf2b64(encryptedData),
                publicKey: ephemeralKeyPair.publicKey,
            },
            ephemeralKeyPair.privateKey,
        ]
    } catch (e) {
        console.error(e)
        throw new UnexpectedError(ErrorCode.Crypto, e)
    }
}

export async function ecdhDecrypt(
    data: ECDHData,
    privateKeyData: JsonWebKey
): Promise<string> {
    try {
        const privateKey = await crypto.subtle.importKey(
            "jwk",
            privateKeyData,
            { name: "ECDH", namedCurve: "P-256" },
            false,
            ["deriveKey"]
        )

        const publicKey = await crypto.subtle.importKey(
            "spki",
            b642buf(data.publicKey),
            { name: "ECDH", namedCurve: "P-256" },
            true,
            []
        )

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
        )

        const decryptedData = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                tagLength: 128,
                iv: b642buf(data.iv),
            },
            symmetricKey,
            b642buf(data.data)
        )
        return ab2str(decryptedData)
    } catch (e) {
        console.error(e)
        throw new VanellusError(ErrorCode.Crypto, String(e))
    }
}
