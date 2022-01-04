// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { generateECDHKeyPair, generateECDSAKeyPair } from "../crypto"
import { VanellusError } from "../errors"
import { UserKeyPairs } from "../interfaces"
import { User } from "./"

export async function generateKeyPairs(
    this: User
): Promise<UserKeyPairs | VanellusError> {
    const signingKeyPair = await generateECDSAKeyPair()
    const encryptionKeyPair = await generateECDHKeyPair()

    const keyPairs = {
        signing: signingKeyPair,
        encryption: encryptionKeyPair,
    }

    this.keyPairs = keyPairs

    return keyPairs
}
