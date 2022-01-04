// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import {
    Booking,
    ConfirmedProviderData,
    ECDHData,
    EncryptedProviderData,
    KeyPair,
    NetworkBackend,
    OK,
    ProviderAppointments,
    PublicKeys,
    SignedAppointment,
    SignedData,
    SignedMediatorKeyData,
    SignedToken,
} from "../interfaces"

// The appointments backend
export class AppointmentsBackend {
    public net: NetworkBackend<unknown>

    constructor(net: NetworkBackend<unknown>) {
        this.net = net
    }

    async confirmProvider(
        {
            confirmedProviderData,
            publicProviderData,
            signedKeyData,
        }: {
            confirmedProviderData: SignedData
            publicProviderData: SignedData
            signedKeyData: SignedData
        },
        keyPair: KeyPair
    ) {
        return await this.net.call<OK>(
            this.net.methods.confirmProvider,
            {
                confirmedProviderData,
                publicProviderData,
                signedKeyData,
            },
            keyPair
        )
    }

    // public endpoints

    async getAppointment({
        id,
        providerID,
    }: {
        id: string
        providerID: string
    }) {
        return this.net.call<ProviderAppointments>(
            this.net.methods.getAppointment,
            { id, providerID }
        )
    }

    async getAppointmentsByZipCode({
        zipCode,
        radius,
        from,
        to,
    }: {
        zipCode: string
        radius: number
        from: string
        to: string
    }) {
        return this.net.call<ProviderAppointments[]>(
            this.net.methods.getAppointmentsByZipCode,
            { zipCode, radius, from, to }
        )
    }

    async getStats({
        id,
        metric,
        type,
        n,
        filter,
        from,
        to,
    }: {
        id?: string
        metric?: string
        type: string
        n?: number
        filter?: { [Key: string]: any }
        from?: string
        to?: string
    }) {
        return await this.net.call(this.net.methods.getStats, {
            id,
            metric,
            type,
            n,
            from,
            to,
            filter,
        })
    }

    // return all public keys present in the system
    async getKeys() {
        return this.net.call<PublicKeys>(this.net.methods.getKeys, {})
    }

    // root endpoints

    // only works for test deployments
    async resetDB({}: {}, keyPair: KeyPair) {
        return await this.net.call<OK>(this.net.methods.resetDB, {}, keyPair)
    }

    async addMediatorPublicKeys(
        { signedKeyData }: { signedKeyData: SignedMediatorKeyData },
        keyPair: KeyPair
    ) {
        return this.net.call<OK>(
            this.net.methods.addMediatorPublicKeys,
            { signedKeyData },
            keyPair
        )
    }

    // user endpoints

    async cancelAppointment(
        {
            providerID,
            id,
            signedTokenData,
        }: { providerID: string; id: string; signedTokenData: SignedData },
        keyPair: KeyPair
    ) {
        return this.net.call<OK>(
            this.net.methods.cancelAppointment,
            { providerID, id, signedTokenData },
            keyPair
        )
    }

    async bookAppointment(
        {
            providerID,
            id,
            encryptedData,
            signedTokenData,
        }: {
            providerID: string
            id: string
            encryptedData: ECDHData
            signedTokenData: SignedData
        },
        keyPair: KeyPair
    ) {
        return this.net.call<Booking>(
            this.net.methods.bookAppointment,
            { providerID, id, encryptedData, signedTokenData },
            keyPair
        )
    }

    // get a token for a given queue
    async getToken({
        hash,
        publicKey,
        code,
    }: {
        hash: string
        publicKey: string
        code?: string
    }) {
        return this.net.call<SignedToken>(this.net.methods.getToken, {
            hash: hash,
            code: code,
            publicKey: publicKey,
        })
    }

    // provider-only endpoints

    // get all published appointments from the backend
    async getAppointments(
        { from, to }: { from: string; to: string },
        keyPair: KeyPair
    ) {
        return this.net.call<SignedAppointment[]>(
            this.net.methods.getProviderAppointments,
            { from, to },
            keyPair
        )
    }

    // publish all local appointments to the backend
    async publishAppointments(
        { appointments }: { appointments: SignedData[] },
        keyPair: KeyPair
    ) {
        return await this.net.call<OK>(
            this.net.methods.publishAppointments,
            { appointments },
            keyPair
        )
    }

    async storeProviderData(
        { encryptedData, code }: { encryptedData: ECDHData; code?: string },
        keyPair: KeyPair
    ) {
        return this.net.call<OK>(
            this.net.methods.storeProviderData,
            { encryptedData, code },
            keyPair
        )
    }

    async checkProviderData({}, keyPair: KeyPair) {
        return await this.net.call<ConfirmedProviderData>(
            this.net.methods.checkProviderData,
            {},
            keyPair
        )
    }

    // mediator-only endpoint

    async getPendingProviderData(
        { limit }: { limit?: number },
        keyPair: KeyPair
    ) {
        return this.net.call<EncryptedProviderData[]>(
            this.net.methods.getPendingProviderData,
            { limit },
            keyPair
        )
    }

    async getVerifiedProviderData(
        { limit }: { limit?: number },
        keyPair: KeyPair
    ) {
        return this.net.call<EncryptedProviderData[]>(
            this.net.methods.getVerifiedProviderData,
            { limit },
            keyPair
        )
    }
}
