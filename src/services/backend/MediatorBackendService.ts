import { EncryptedProviderData, SignedData } from "../../interfaces"
import { AnonymousBackendService } from "./AnonymousBackendService"

export interface MediatorBackendService extends AnonymousBackendService {
    confirmProvider: ({
        signedConfirmedProviderData,
        signedPublicProviderData,
        signedKeyData,
    }: {
        signedConfirmedProviderData: SignedData
        signedPublicProviderData: SignedData
        signedKeyData: SignedData
    }) => boolean

    getPendingProviderData: ({
        limit,
    }: {
        limit: undefined | number
    }) => EncryptedProviderData[]

    getVerifiedProviderData: ({
        limit,
    }: {
        limit: undefined | number
    }) => EncryptedProviderData[]
}
