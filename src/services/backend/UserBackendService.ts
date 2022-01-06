import { Booking, ECDHData, SignedData, SignedToken } from "../.."
import { AnonymousBackendService } from "./AnonymousBackendService"

export interface UserBackendService extends AnonymousBackendService {
    cancelAppointment: ({
        providerID,
        id,
        signedTokenData,
    }: {
        providerID: string
        id: string
        signedTokenData: SignedData
    }) => boolean

    bookAppointment: ({
        providerID,
        id,
        encryptedData,
        signedTokenData,
    }: {
        providerID: string
        id: string
        encryptedData: ECDHData
        signedTokenData: SignedData
    }) => Booking

    // get a token for a given queue
    getToken: ({
        hash,
        publicKey,
        code,
    }: {
        hash: string
        publicKey: string
        code?: string
    }) => SignedToken
}
