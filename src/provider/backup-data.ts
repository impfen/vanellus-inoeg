// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Status, Result, Error } from "../interfaces"
import { aesEncrypt, deriveSecrets } from "../crypto"
import { KeyPair } from "../interfaces"
import { base322buf, b642buf } from "../helpers/conversion"
import { KeyPairs, ProviderData, VerifiedProviderData } from "../interfaces"
import { Provider } from "./"

interface BackupData {
    createdAt: string
    version: string
    [Key: string]: any
}

interface LocalBackupData extends BackupData {
    keyPairs: KeyPairs | null
}

interface CloudBackupData extends BackupData {
    verifiedData: VerifiedProviderData | null
    data: ProviderData | null
}

interface BackupDataError extends Error {}

  /**
   * combines generateKeyFile() and uploadData() into a single step
   * @param secret the 24 character alphanumeric secret from the provider
   */

export async function backupData(this: Provider, secret: string) {
    const result = this.generateKeyFile(secret)
    return this.uploadData().then(() => result)
}

  /**
   * encrypt keys for file storage. Returns the contents of the key file for
   * the user which together with the secret can be used to log in the provider
   * @param secret the 24 character alphanumeric secret from the provider
   */

export async function generateKeyFile(this: Provider, secret: string) {
    const localData: LocalBackupData = {
        version: "0.2",
        keyPairs: this.keyPairs,
        createdAt: new Date().toISOString(),
    }

    const encryptedData = await aesEncrypt(
        JSON.stringify(localData),
        base322buf(secret)
    )

    return encryptedData
}

/**
 * upload encrypted metadata to the backend for later restore
 */

export async function uploadData(this: Provider) {
    const cloudData: CloudBackupData = {
        version: "0.2",
        createdAt: new Date().toISOString(),
        data: this.data,
        verifiedData: this.verifiedData,
    }

    const idAndKey = await deriveSecrets(
        b642buf(this.keyPairs!.sync),
        32,
        2
    )

    const [id, key] = idAndKey!

    // cloud stored data
    const encryptedCloudData = await aesEncrypt(
        JSON.stringify(cloudData),
        b642buf(key)
    )

    const result = await this.backend.storage.storeSettings({
        id: id,
        data: encryptedCloudData,
    })

}

