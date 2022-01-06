// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.
//
import { VanellusError } from "../errors"
import { KeyPair } from "./"

export interface Store {
    get(key: string, defaultValue?: any): any
    set(key: string, value: any): void
    delete(key: string): void
    deleteAll(prefix: string): void
}

export enum Status {
    Succeeded = "succeeded",
    Failed = "failed",
    Waiting = "waiting",
}

export interface Result {
    status: Status.Succeeded
    [key: string]: any
}

export interface NetworkBackend<T> {
    apiUrl: string
    methods: NetworkMethods<T>
    call<R = any>(
        method: T,
        params: Record<string, unknown>,
        keyPair?: KeyPair,
        id?: string
    ): Promise<R | VanellusError>
}

export interface NetworkMethods<T> {
    addMediatorPublicKeys: T
    bookAppointment: T
    cancelAppointment: T
    checkProviderData: T
    confirmProvider: T
    getAppointment: T
    getAppointmentsByZipCode: T
    getKeys: T
    getPendingProviderData: T
    getProvidersByZipCode: T
    getProviderAppointments: T
    getSettings: T
    getStats: T
    getToken: T
    getVerifiedProviderData: T
    publishAppointments: T
    resetDB: T
    storeProviderData: T
    storeSettings: T
}

// export interface Error {
//     status: Status.Failed
//     error?: { [key: string]: any }
// }
