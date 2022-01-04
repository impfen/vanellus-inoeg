// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import JSONRPCBackend from "./jsonrpc"
import { KeyPair, OK, AESData } from "../interfaces"

// The storage backend
export class StorageBackend extends JSONRPCBackend {
    constructor(apiUrl: string) {
        super(apiUrl)
    }

    async storeSettings({ id, data }: { id: string, data: AESData }) {
        return await this.call<OK>(this.methods.storeSettings, { id, data })
    }

    async getSettings({ id }: { id: string }) {
        return await this.call<AESData>(this.methods.getSettings, { id })
    }

    // only works for test deployments
    async resetDB({}: {}, keyPair: KeyPair) {
        return await this.call<OK>(this.methods.resetDB, {}, keyPair)
    }
}
