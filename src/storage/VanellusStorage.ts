// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { parseUntrustedJSON } from "../utils";

export class VanellusStorage implements Storage {
    constructor(
        protected readonly prefix: string | undefined = undefined,
        protected readonly storageAdapter: Storage = localStorage
    ) {}

    public clear(): void {
        return this.storageAdapter.clear();
    }

    public key(index: number) {
        return this.storageAdapter.key(index);
    }

    public removeItem(key: string): void {
        return this.storageAdapter.removeItem(this.getKey(key));
    }

    public setItem(key: string, value: string): void {
        if (value === null || value === undefined) {
            return this.removeItem(key);
        }

        return this.storageAdapter.setItem(
            this.getKey(key),
            JSON.stringify(value)
        );
    }

    public getItem(key: string, defaultValue?: string): string | null {
        const data = this.storageAdapter.getItem(this.getKey(key));

        if (data !== null) {
            return parseUntrustedJSON(data);
        }

        if (defaultValue !== undefined) {
            return defaultValue;
        }

        return null;
    }

    public deleteAll(prefix: string) {
        const keys: string[] = [];

        for (let i = 0; i < this.storageAdapter.length; i++) {
            const key = this.storageAdapter.key(i);

            if (key !== null && key.startsWith(prefix)) {
                keys.push(key);
            }
        }

        keys.forEach((key) => this.removeItem(key));
    }

    public get length() {
        return this.storageAdapter.length;
    }

    protected getKey(key: string) {
        return this.prefix ? `${this.prefix}::${key}` : key;
    }
}
