// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { aesDecrypt, deriveSecrets } from "../crypto"
import { ErrorCode, VanellusError } from "../errors"
import { b642buf, base322buf } from "../helpers/conversion"
import { parseUntrustedJSON } from "../helpers/parseUntrustedJSON"
import { Result, Status } from "../interfaces"
import { User } from "./"
import { CloudBackupData } from "./backup-data"

export interface RestoreFromBackupResult extends Result {
    data: CloudBackupData
}

// make sure the signing and encryption key pairs exist
export async function restoreFromBackup(
    this: User
): Promise<RestoreFromBackupResult | VanellusError> {
    if (!this.secret)
        return new VanellusError(ErrorCode.DataMissing, "Secret is missing")

    const secrets = await deriveSecrets(base322buf(this.secret), 32, 2)

    const [id, key] = secrets
    const response = await this.backend.storage.getSettings({ id: id })
    if (response instanceof VanellusError) return response

    const decryptedData = await aesDecrypt(response, b642buf(key))
    if (decryptedData instanceof VanellusError) return decryptedData

    const dd = parseUntrustedJSON<CloudBackupData>(decryptedData)
    if (!dd)
        return new VanellusError(ErrorCode.DataMissing, "invalid backup data")

    this.tokenData = dd.tokenData
    this.queueData = dd.queueData
    this.contactData = dd.contactData
    this.acceptedAppointment = dd.acceptedAppointment

    return {
        status: Status.Succeeded,
        data: dd,
    }
}
