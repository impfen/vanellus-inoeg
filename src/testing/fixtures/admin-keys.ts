// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import fs from "fs"

import { generateECDSAKeyPair } from "../../crypto"
import { settingsPath } from "../settings"
import { KeyPair } from "../../interfaces"
import { b642buf, buf2b64 } from "../../helpers/conversion"

export interface AdminKeys {
    root: KeyPair
    provider: KeyPair
    token: KeyPair
}

export async function adminKeys(): Promise<AdminKeys> {
    const keys = fs.readFileSync(`${settingsPath}/002_admin.json`, "ascii")
    const json = JSON.parse(keys)
    const extractKey = async (name: string): Promise<KeyPair> => {
        const keyData: { [Key: string]: string } = json.admin.signing.keys.find(
            (key: any) => key.name === name
        )

        // this will not work in Firefox, but that's ok as it's only for testing...
        const importedKey = await crypto.subtle.importKey(
            "pkcs8",
            b642buf(keyData.privateKey),
            {
                name: keyData.type === "ecdh" ? "ECDH" : "ECDSA",
                namedCurve: "P-256",
            },
            true,
            keyData.type === "ecdh" ? ["deriveKey"] : ["sign"]
        )

        // we reexport as JWK as that's the format that the library expects...
        let privateKey = await crypto.subtle.exportKey("jwk", importedKey)

        return {
            publicKey: keyData.publicKey,
            privateKey: privateKey,
        }
    }
    return {
        root: await extractKey("root"),
        token: await extractKey("token"),
        provider: await extractKey("provider"),
    }
}
