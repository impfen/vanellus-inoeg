// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { AESData, KeyPair, NetworkBackend, OK } from "../interfaces"

// The storage backend
export class StorageBackend {
    public net: NetworkBackend<any>

    constructor(net: NetworkBackend<any>) {
        this.net = net
    }

    async storeSettings({ id, data }: { id: string; data: AESData }) {
        return await this.net.call<OK>(this.net.methods.storeSettings, {
            id,
            data,
        })
    }

    async getSettings({ id }: { id: string }) {
        return await this.net.call<AESData>(this.net.methods.getSettings, {
            id,
        })
    }

    // only works for test deployments
    async resetDB({}: {}, keyPair: KeyPair) {
        return await this.net.call<OK>(this.net.methods.resetDB, {}, keyPair)
    }
}
