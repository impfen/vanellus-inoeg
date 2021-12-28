// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { backupData, generateKeyFile, uploadData} from "./backup-data"
import { checkVerifiedProviderData } from "./check-verified-provider-data"
import { generateKeyPairs } from "./generate-key-pairs"
import { providerData } from "./provider-data"
import { submitProviderData } from "./submit-provider-data"
import { createAppointment } from "./create-appointment"
import { verifiedProviderData } from "./verified-provider-data"
import { providerSecret, initSecret } from "./provider-secret"
import { restoreFromBackup } from "./restore-from-backup"
import { updateAppointment } from "./update-appointment"
import { cancelAppointment } from "./cancel-appointment"
import { publishAppointments } from "./publish-appointments"
import { getAppointments } from "./get-appointments"

import { Actor } from "../actor"
import { Backend } from "../backend"
import { ecdhEncrypt } from "../crypto"
import {
    ProviderBackupReferenceData,
    ProviderData,
    VerifiedProviderData,
    KeyPair,
    ProviderKeyPairs,
    Appointment,
} from "../interfaces"

export class Provider extends Actor {
    public backupData = backupData
    public generateKeyFile = generateKeyFile
    public uploadData = uploadData
    public checkVerifiedProviderData = checkVerifiedProviderData
    public providerData = providerData
    public submitProviderData = submitProviderData
    public createAppointment = createAppointment
    public verifiedProviderData = verifiedProviderData
    public providerSecret = providerSecret
    public initSecret = initSecret
    public restoreFromBackup = restoreFromBackup
    public updateAppointment = updateAppointment
    public cancelAppointment = cancelAppointment
    public publishAppointments = publishAppointments
    public getAppointments = getAppointments
    public generateKeyPairs = generateKeyPairs

    /**
     * create a new blank provider object
     * @param id A string to identify the provoder. Used to diferentiate objects
     * in the storage backend
     * @param backend The backend used for data storage and network
     * communication
     */

    constructor(id: string, backend: Backend) {
        super("provider", id, backend)
    }

    /**
     * create a new provider with data and fresh keys
     * @param id A string to identify the provoder. Used to diferentiate objects
     * in the storage backend
     * @param backend The backend used for data storage and network
     * communication
     * @param data The metadata for the provider. Since keys are freshly
     * generated, the publicKeys entry is ignored
     */

    public static async init(id: string, backend: Backend, data: ProviderData) {
        const provider = new Provider(id, backend)

        await provider.generateKeyPairs()

        data.publicKeys = {
            encryption: provider.keyPairs!.encryption.publicKey,
            signing: provider.keyPairs!.signing.publicKey,
        }
        provider.data = data
        const publicKeys = await provider.getKeys()

        const encryptedData = await ecdhEncrypt(
            JSON.stringify(data),
            provider.keyPairs!.data,
            publicKeys.providerData,
        )

        const response = await backend.appointments.storeProviderData(
            { encryptedData: encryptedData! },
            provider.keyPairs!.signing,
        )
        if (response != "ok")
            throw new Error("can't store provider data in backend")

        return provider
    }

    public get openAppointments(): Appointment[] {
        return this.get("openAppointments")
    }

    public set openAppointments(appointments: Appointment[]) {
        this.set("openAppointments", appointments)
    }

    public get loggedOut(): boolean {
        return this.get("loggedOut")
    }

    public set loggedOut(loggedOut: boolean) {
        this.set("loggedOut", loggedOut)
    }

    public get keyPairs(): ProviderKeyPairs | null {
        return this.get("keyPairs")
    }

    public set keyPairs(keyPairs: ProviderKeyPairs | null) {
        this.set("keyPairs", keyPairs)
    }

    public get referenceData(): ProviderBackupReferenceData | null {
        return this.get("referenceData")
    }

    public set referenceData(
        referenceData: ProviderBackupReferenceData | null
    ) {
        this.set("referenceData", referenceData)
    }

    public get data(): ProviderData | null {
        return this.get("data")
    }

    public set data(data: ProviderData | null) {
        this.set("data", data)
    }

    public get verifiedData(): VerifiedProviderData | null {
        return this.get("verifiedData")
    }

    public set verifiedData(verifiedData: VerifiedProviderData | null) {
        this.set("verifiedData", verifiedData)
    }

    public get secret(): string {
        return this.get("secret")
    }

    public set secret(secret: string) {
        this.set("secret", secret)
    }
}
