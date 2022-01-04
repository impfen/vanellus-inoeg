// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { aesEncrypt, deriveSecrets } from "../crypto"
import { ErrorCode, VanellusError } from "../errors"
import { b642buf, base322buf } from "../helpers/conversion"
import {
    AcceptedAppointment,
    AESData,
    ContactData,
    QueueData,
    Result,
    Status,
    TokenData,
} from "../interfaces"
import { User } from "./"

interface BackupData {
    createdAt: string
    version: string
    [Key: string]: any
}

export interface CloudBackupData extends BackupData {
    tokenData: TokenData | null
    queueData: QueueData | null
    contactData: ContactData | null
    acceptedAppointment: AcceptedAppointment | null
}

export interface BackupDataResult extends Result {
    data: AESData
}

// make sure the signing and encryption key pairs exist
export async function backupData(
    this: User
): Promise<BackupDataResult | VanellusError> {
    if (!this.secret)
        return new VanellusError(ErrorCode.DataMissing, "secret is missing")

    const cloudData: CloudBackupData = {
        version: "0.2",
        createdAt: new Date().toISOString(),
        tokenData: this.tokenData,
        queueData: this.queueData,
        contactData: this.contactData,
        acceptedAppointment: this.acceptedAppointment,
    }

    const idAndKey = await deriveSecrets(base322buf(this.secret), 32, 2)

    const [id, key] = idAndKey

    const encryptedData = await aesEncrypt(
        JSON.stringify(cloudData),
        b642buf(key)
    )

    const response = await this.backend.storage.storeSettings({
        id: id,
        data: encryptedData,
    })

    if (response instanceof VanellusError) response

    return {
        status: Status.Succeeded,
        data: encryptedData,
    }
}
