import { AESData, KeyPair } from "../../interfaces"

export interface StorageBackendService {
    storeSettings: (id: string, data: AESData) => boolean
    getSettings: (id: string) => AESData

    // only works for test deployments
    resetDB: (keyPair: KeyPair) => boolean
}
