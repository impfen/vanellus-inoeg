// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { sign } from "../crypto"
import { BackendError, VanellusError } from "../errors"
import { KeyPair, NetworkBackend, NetworkMethods } from "../interfaces"

class JSONRPCMethods implements NetworkMethods<string> {
    public readonly addMediatorPublicKeys = "addMediatorPublicKeys"
    public readonly bookAppointment = "bookAppointment"
    public readonly cancelAppointment = "cancelAppointment"
    public readonly checkProviderData = "checkProviderData"
    public readonly confirmProvider = "confirmProvider"
    public readonly getAppointment = "getAppointment"
    public readonly getAppointmentsByZipCode = "getAppointmentsByZipCode"
    public readonly getKeys = "getKeys"
    public readonly getPendingProviderData = "getPendingProviderData"
    public readonly getProviderAppointments = "getProviderAppointments"
    public readonly getSettings = "getSettings"
    public readonly getStats = "getStats"
    public readonly getToken = "getToken"
    public readonly getVerifiedProviderData = "getVerifiedProviderData"
    public readonly publishAppointments = "publishAppointments"
    public readonly resetDB = "resetDB"
    public readonly storeProviderData = "storeProviderData"
    public readonly storeSettings = "storeSettings"
}

export class JSONRPCBackend implements NetworkBackend<string> {
    public readonly methods = new JSONRPCMethods()
    public apiUrl = ""

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl
    }

    async call<R = any>(
        method: string,
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
                })
            }

            return (await response.json()).result as R
        } catch (e) {
            return new BackendError({
                error: JSON.stringify(e),
            })
        }
    }
}
