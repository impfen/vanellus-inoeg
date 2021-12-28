// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

export interface Store {
    get(key: string, defaultValue?: any): any
    set(key: string, value: any): void
    delete(key: string): void
    deleteAll(prefix: string): void
}

export interface Storage {
    getItem(key: string): any | null
    setItem(key: string, value: any): void
    getKeys(): string[]
    removeItem(key: string): void
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

export interface Error {
    status: Status.Failed
    error?: { [key: string]: any }
}
