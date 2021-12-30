// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import {
    generateECDHKeyPair,
    generateECDSAKeyPair,
    generateSymmetricKey,
} from "../crypto"

import { Provider } from "./"
import { ProviderKeyPairs } from "../interfaces"

  /**
   * Generates all needed key pairs for the provider and stores them in the
   * provider object
   */

export async function generateKeyPairs(
    this: Provider
): Promise<ProviderKeyPairs> {
    const syncKey = await generateSymmetricKey()
    const dataKeyPair = await generateECDHKeyPair()
    const signingKeyPair = await generateECDSAKeyPair()
    const encryptionKeyPair = await generateECDHKeyPair()

    const keyPairs = {
        sync: syncKey!,
        signing: signingKeyPair!,
        data: dataKeyPair!,
        encryption: encryptionKeyPair!,
    }

    this.keyPairs = keyPairs
    return keyPairs
}
