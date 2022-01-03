// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { aesDecrypt, deriveSecrets } from "../crypto"
import { base322buf, b642buf } from "../helpers/conversion"
import { Provider } from "./"
import { LocalBackupData, CloudBackupData } from "./backup-data"
import { AESData, Result, Status } from "../interfaces"
import { ErrorCode, VanellusError } from '../errors'
import { parseUntrustedJSON } from '../helpers/parseUntrustedJSON'

interface RestoreFromBackupResult extends Result {
    data: { [Key: string]: any } | null
}

/**
 * Restores the data of a provider by decrypting the provider keys with the
 * provider secret and subsequently downloading the provider metadata from the
 * server.
 * @param secret the 24 character alphanumeric secret from the provider
 * @param data the encrypted keys from the provider backup file
 */

export async function restoreFromBackup(
    this: Provider,
    data: AESData
): Promise<RestoreFromBackupResult | VanellusError> {
    const decryptedKeyData = await aesDecrypt(data, base322buf(this.secret))
    if (decryptedKeyData instanceof VanellusError) return decryptedKeyData

    const dd = parseUntrustedJSON<LocalBackupData>(decryptedKeyData)

    if (!dd || !dd.keyPairs) return new VanellusError(ErrorCode.DataMissing, "invalid decrypted key pairs")

    const derivedSecrets = await deriveSecrets(
        b642buf(dd.keyPairs.sync),
        32,
        2
    )

    const [id, key] = derivedSecrets

    const response = await this.backend.storage.getSettings({
        id: id,
    })

    if (response instanceof VanellusError) return response

    const decryptedData = await aesDecrypt(response, b642buf(key))
    if (decryptedData instanceof VanellusError) return decryptedData

    const ddCloud = parseUntrustedJSON<CloudBackupData>(decryptedData)
    if (!ddCloud) return new VanellusError(ErrorCode.DataMissing, "invalid decrypted settings")

    this.keyPairs = dd.keyPairs
    this.data = ddCloud.data
    this.verifiedData = ddCloud.verifiedData

    return {
        status: Status.Succeeded,
        data: ddCloud.data,
    }
}
