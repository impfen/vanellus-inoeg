// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Actor } from "../actor"
import { Backend } from "../backend"
import { randomBytes } from "../crypto"
import { b642buf, buf2base32 } from "../helpers/conversion"
import {
    AcceptedAppointment,
    ContactData,
    ProviderAppointments,
    QueueData,
    TokenData,
    UserKeyPairs,
} from "../interfaces"
import { backupData } from "./backup-data"
import { bookAppointment } from "./book-appointment"
import { cancelAppointment } from "./cancel-appointment"
import { generateKeyPairs } from "./generate-key-pairs"
import { getToken } from "./get-token"
import { restoreFromBackup } from "./restore-from-backup"

export class User extends Actor {
    public restoreFromBackup = restoreFromBackup
    public cancelAppointment = cancelAppointment
    public generateKeyPairs = generateKeyPairs
    public bookAppointment = bookAppointment
    public backupData = backupData
    public getToken = getToken

    private generateSecret() {
        this.secret = buf2base32(b642buf(randomBytes(10)))
    }

    constructor(id: string, backend: Backend) {
        super("user", id, backend)
    }

    public async initialize() {
        this.generateSecret()
        await this.generateKeyPairs()
    }

    public get queueData(): QueueData | null {
        return this.get("queueData")
    }

    public set queueData(queueData: QueueData | null) {
        this.set("queueData", queueData)
    }

    public get secret(): string | null {
        return this.get("secret")
    }

    public set secret(secret: string | null) {
        this.set("secret", secret)
    }

    public get keyPairs(): UserKeyPairs | null {
        return this.get("keyPairs")
    }

    public set keyPairs(keyPairs: UserKeyPairs | null) {
        this.set("keyPairs", keyPairs)
    }

    public get tokenData(): TokenData | null {
        return this.get("tokenData")
    }

    public set tokenData(tokenData: TokenData | null) {
        this.set("tokenData", tokenData)
    }

    public get contactData(): ContactData | null {
        return this.get("contactData")
    }

    public set contactData(contactData: ContactData | null) {
        this.set("contactData", contactData)
    }

    public get verifiedAppointments(): ProviderAppointments[] | null {
        return this.get("verifiedAppointments")
    }

    public set verifiedAppointments(
        verifiedAppointments: ProviderAppointments[] | null
    ) {
        this.set("verifiedAppointments", verifiedAppointments)
    }

    public get acceptedAppointment(): AcceptedAppointment | null {
        return this.get("acceptedAppointment")
    }

    public set acceptedAppointment(
        acceptedAppointment: AcceptedAppointment | null
    ) {
        this.set("acceptedAppointment", acceptedAppointment)
    }

    /**
     * Deletes the local data for this user
     */

    public clear() {
        super.clear()
    }
}
