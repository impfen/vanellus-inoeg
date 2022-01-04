// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Store } from "../interfaces"

export class PrefixStore implements Store {
    public prefix: string
    public store: Store

    constructor(store: Store, prefix: string) {
        this.store = store
        this.prefix = prefix
    }

    set(key: string, data: any) {
        return this.store.set(`${this.prefix}::${key}`, data)
    }

    get(key: string, defaultValue?: any) {
        return this.store.get(`${this.prefix}::${key}`, defaultValue)
    }

    delete(key: string) {
        return this.store.delete(`${this.prefix}::${key}`)
    }

    deleteAll(prefix: string) {
        this.store.deleteAll(`${this.prefix}::${prefix}`)
    }
}

export class StorageStore implements Store {
    public storage: Storage

    constructor(storage: Storage) {
        this.storage = storage
    }

    set(key: string, data: any) {
        if (data === null || data === undefined) return this.delete(key)
        this.storage.setItem(key, JSON.stringify(data))
    }

    get(key: string, defaultValue?: any) {
        const data = this.storage.getItem(key)
        if (data !== null) return JSON.parse(data)
        if (defaultValue !== undefined) return defaultValue
        return null
    }

    delete(key: string) {
        this.storage.removeItem(key)
    }

    deleteAll(prefix: string) {
        const keys: string[] = []
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i)
            if (key !== null && key.startsWith(prefix)) keys.push(key)
        }
        keys.forEach((key) => this.storage.removeItem(key))
    }
}

/**
 * Implements the Storage interface for local testing. Frontends running in a
 * browser should use localStorage
 */

export class InMemoryStorage implements Storage {
    private _data: { [Key: string]: any }

    private updateLength() {
        this.length = Object.keys(this._data).length
    }

    public length = 0

    constructor() {
        this._data = {}
        this.updateLength()
    }

    getItem(key: string): any | null {
        return this._data[key] || null
    }

    setItem(key: string, value: any): void {
        this._data[key] = value
        this.updateLength()
    }

    key(index: number) {
        return Object.keys(this._data)[index]
    }

    clear() {
        Object.keys(this._data).forEach((key) => this.removeItem(key))
    }

    removeItem(key: string): void {
        delete this._data[key]
        this.updateLength()
    }
}
