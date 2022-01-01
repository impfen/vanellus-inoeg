// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { VanellusError, BackendError } from '../errors'
import { sign } from "../crypto"
import { Settings } from "../interfaces"
import { KeyPair } from "../interfaces"

enum JSONRPCMethods {
    addMediatorPublicKeys = "addMediatorPublicKeys",
    bookAppointment = "bookAppointment",
    cancelAppointment = "cancelAppointment",
    checkProviderData = "checkProviderData",
    confirmProvider = "confirmProvider",
    getAppointment = "getAppointment",
    getAppointmentsByZipCode = "getAppointmentsByZipCode",
    getBookedAppointments = "getBookedAppointments",
    getKeys = "getKeys",
    getPendingProviderData = "getPendingProviderData",
    getProviderAppointments = "getProviderAppointments",
    getSettings = "getSettings",
    getStats = "getStats",
    getToken = "getToken",
    getVerifiedProviderData = "getVerifiedProviderData",
    publishAppointments = "publishAppointments",
    resetDB = "resetDB",
    storeProviderData = "storeProviderData",
    storeSettings = "storeSettings",
}

class JSONRPCBackend {
    public settings: Settings
    public urlKey: "storage" | "appointments"
    public readonly methods = JSONRPCMethods

    constructor(settings: Settings, urlKey: "storage" | "appointments") {
        this.settings = settings
        this.urlKey = urlKey
    }

    get apiUrl(): string {
        return this.settings.apiUrls[this.urlKey]
    }

    async call<R = any>(
        method: JSONRPCMethods,
        params: Record<string, unknown>,
        keyPair?: KeyPair,
        id?: string
    ): Promise<R | VanellusError> {
        let callParams

        if (typeof keyPair === "object") {
            const dataToSign = {
                ...params,
                timestamp: new Date().toISOString(),
            }

            const signedData = await sign(
                keyPair.privateKey,
                JSON.stringify(dataToSign),
                keyPair.publicKey
            )
            callParams = signedData
        } else {
            callParams = params
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    ["Content-Type"]: "application/json",
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: method,
                    params: callParams,
                    id: id,
                }),
            })

            if (!response.ok) {
                return new BackendError({
                        error: response.statusText,
                        data: await response.json(),
                    }
                )
            }

            return (await response.json()).result as R
        } catch (e) {
            return new BackendError({
                error: JSON.stringify(e),
            })
        }
    }
}

export default JSONRPCBackend
