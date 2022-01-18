// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { parseUntrustedJSON } from "../utils";
import { InMemoryStorageAdapter } from "./InMemoryStorageAdapter";
export class VanellusStorage {
    constructor(
        protected readonly prefix: string | undefined = undefined,
        protected readonly storageAdapter: Storage = typeof window !==
        "undefined"
            ? window.localStorage
            : new InMemoryStorageAdapter()
    ) {}

    public key(index: number) {
        return this.storageAdapter.key(index);
    }

    public remove(key: string): void {
        return this.storageAdapter.removeItem(this.getKey(key));
    }

    public set(key: string, value: unknown): void {
        if (value === null || value === undefined) {
            return this.remove(key);
        }

        return this.setItem(key, JSON.stringify(value));
    }

    public get<T = string | null>(key: string, defaultValue?: T) {
        try {
            const data = this.getItem(key);

            if (data !== null) {
                return parseUntrustedJSON<T>(data);
            }

            if (defaultValue !== undefined) {
                return defaultValue;
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    public removeAll() {
        this.getKeys().forEach((key) => {
            this.remove(key);
        });
    }

    public getKeys() {
        const prefix = this.prefix ? `${this.prefix}::` : "";
        const keys: string[] = [];

        for (let i = 0; i < this.storageAdapter.length; i++) {
            const key = this.storageAdapter.key(i);

            if (key !== null && (!prefix || key.startsWith(prefix))) {
                keys.push(key.replace(prefix, ""));
            }
        }

        return keys;
    }

    protected getKey(key: string) {
        return this.prefix ? `${this.prefix}::${key}` : key;
    }

    protected setItem(key: string, value: string): void {
        if (value === null || value === undefined) {
            return this.remove(key);
        }

        return this.storageAdapter.setItem(this.getKey(key), value);
    }

    protected getItem(key: string) {
        return this.storageAdapter.getItem(this.getKey(key));
    }
}
