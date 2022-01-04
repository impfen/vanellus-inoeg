// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { sign } from "../crypto"
import { BackendError, VanellusError } from "../errors"
import { KeyPair, NetworkBackend, NetworkMethods } from "../interfaces"

type P = Record<string, unknown>
export interface RESTMethod {
    toUri(params: Record<string, unknown>): string
    httpMethod: string
}

class RESTMethods implements NetworkMethods<RESTMethod> {
    public readonly addMediatorPublicKeys = {
        toUri: (p: P) => "mediators",
        httpMethod: "POST",
    }
    public readonly bookAppointment = {
        toUri: (p: P) => "appointments/book",
        httpMethod: "POST",
    }
    public readonly cancelAppointment = {
        toUri: (p: P) => "appointments/cancel",
        httpMethod: "DELETE",
    }
    public readonly checkProviderData = {
        toUri: (p: P) => "providers/data/check",
        httpMethod: "POST",
    }
    public readonly confirmProvider = {
        toUri: (p: P) => "providers",
        httpMethod: "POST",
    }
    public readonly getAppointment = {
        toUri: (p: P) =>
            ["provider", <string>p.providerID, "appointments", <string>p.id]
                .map(encodeURIComponent)
                .join("/"),
        httpMethod: "GET",
    }
    public readonly getAppointmentsByZipCode = {
        toUri: (p: P) =>
            [
                "appointments",
                "zipCode",
                <string>p.zipCode,
                <number>p.radius,
                <string>p.from,
                <string>p.to,
            ]
                .map(encodeURIComponent)
                .join("/"),
        httpMethod: "GET",
    }
    public readonly getKeys = { toUri: (p: P) => "keys", httpMethod: "GET" }
    public readonly getPendingProviderData = {
        toUri: (p: P) => "providers/pending",
        httpMethod: "POST",
    }
    public readonly getProviderAppointments = {
        toUri: (p: P) => "appointments",
        httpMethod: "POST",
    }
    public readonly getSettings = {
        toUri: (p: P) => `store/${encodeURIComponent(<string>p.id)}`,
        httpMethod: "GET",
    }
    public readonly getStats = { toUri: (p: P) => "stats", httpMethod: "GET" }
    public readonly getToken = { toUri: (p: P) => "token", httpMethod: "POST" }
    public readonly getVerifiedProviderData = {
        toUri: (p: P) => "providers/verified",
        httpMethod: "POST",
    }
    public readonly publishAppointments = {
        toUri: (p: P) => "appointments/publish",
        httpMethod: "POST",
    }
    public readonly resetDB = {
        toUri: (p: P) => "db/reset",
        httpMethod: "DELETE",
    }
    public readonly storeProviderData = {
        toUri: (p: P) => "providers/data",
        httpMethod: "POST",
    }
    public readonly storeSettings = {
        toUri: (p: P) => "store",
        httpMethod: "PUT",
    }
}

export class RESTBackend implements NetworkBackend<RESTMethod> {
    public readonly methods = new RESTMethods()
    public apiUrl = ""

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl
    }

    async call<R = any>(
        method: RESTMethod,
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
            const uri = this.apiUrl + method.toUri(params)
            let response
            if (method.httpMethod === "GET") {
                response = await fetch(uri, {
                    method: "GET",
                    headers: {
                        ["content-type"]: "application/json",
                    },
                })
            } else {
                response = await fetch(uri, {
                    method: method.httpMethod,
                    headers: {
                        ["content-type"]: "application/json",
                    },
                    body: JSON.stringify(callParams),
                })
            }

            if (!response.ok) {
                return new BackendError({
                    error: response.statusText,
                    data: await response.json(),
                })
            }

            return (await response.json()) as R
        } catch (e) {
            return new BackendError({
                error: JSON.stringify(e),
            })
        }
    }
}
