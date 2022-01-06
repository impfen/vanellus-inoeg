import { AESData, KeyPair } from "../../interfaces"

export interface StorageBackendService {
    storeSettings: (id: string, data: AESData) => Promise<boolean>
    getSettings: (id: string) => Promise<AESData>

    // only works for test deployments
    resetDB: (keyPair: KeyPair) => Promise<boolean>
}
