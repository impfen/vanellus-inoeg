// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { generateECDHKeyPair, generateECDSAKeyPair } from "../crypto"

import { User } from "./"
import { UserKeyPairs } from "../interfaces"
import { VanellusError } from '../errors'

export async function generateKeyPairs(this: User): Promise<UserKeyPairs | VanellusError> {
    const signingKeyPair = await generateECDSAKeyPair()
    if (signingKeyPair instanceof VanellusError) return signingKeyPair

    const encryptionKeyPair = await generateECDHKeyPair()
    if (encryptionKeyPair instanceof VanellusError) return encryptionKeyPair

    const keyPairs = {
        signing: signingKeyPair,
        encryption: encryptionKeyPair,
    }

    this.keyPairs = keyPairs

    return keyPairs
}