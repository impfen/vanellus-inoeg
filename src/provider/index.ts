// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { backupData } from "./backup-data"
import { checkData } from "./check-data"
import { generateKeyPairs } from "./generate-key-pairs"
import { storeData } from "./store-data"
import { cancelAppointment } from "./cancel-appointment"
import { createAppointment } from "./create-appointment"
import { restoreFromBackup } from "./restore-from-backup"
import { publishAppointments } from "./publish-appointments"
import { getAppointments } from "./get-appointments"

import { buf2base32, b642buf } from "../helpers/conversion"
import { randomBytes } from "../crypto"
import { Actor } from "../actor"
import { Backend } from "../backend"

import {
    ProviderData,
    VerifiedProviderData,
    ProviderKeyPairs,
} from "../interfaces"
import { ErrorCode, UnexpectedError } from '../errors'

export * from "./helpers"

export class Provider extends Actor {
    public backupData = backupData
    public checkData = checkData
    public storeData = storeData
    public cancelAppointment = cancelAppointment
    public createAppointment = createAppointment
    public restoreFromBackup = restoreFromBackup
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
     * create a new complete provider object from user provided data,
     * including fresh keys
     * @param id A string to identify the provoder. Used to diferentiate objects
     * in the storage backend
     * @param backend The backend used for data storage and network
     * communication
     * @param data The provider data
     */

    public static async initialize(
        id: string,
        backend: Backend,
        data: ProviderData,
    ) {
        const provider = new Provider(id, backend)
        await provider.create({
            name: data.name,
            street: data.street,
            city: data.city,
            zipCode: data.zipCode,
            description: data.description,
            email: data.email,
            accessible: data.accessible,
            website: data.website,
            publicKeys: {
                encryption: "",
                signing: "",
            },
        })
        return provider
    }

    /**
     * populate a blank provider object with data and keys.
     * @param data The provider data
     */

    public async create(
        data: ProviderData,
    ) {
        this.clear()
        this.generateSecret()
        const keyPairs = await this.generateKeyPairs()
        if (!this.keyPairs) {
            throw new UnexpectedError(ErrorCode.KeysMissing)
        }

        this.data = {
            name: data.name,
            street: data.street,
            city: data.city,
            zipCode: data.zipCode,
            description: data.description,
            email: data.email,
            accessible: data.accessible,
            website: data.website,
            publicKeys: {
                encryption: keyPairs.encryption.publicKey,
                signing: keyPairs.signing.publicKey,
            },
        }
        return this
    }

    private generateSecret() {
        this.secret = buf2base32(b642buf(randomBytes(15)))
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

    /**
     * Deletes the local data for this provider
     */

    public clear() {
        super.clear()
    }
}
