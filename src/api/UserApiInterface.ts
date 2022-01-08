import { AnonymousApiInterface } from "./AnonymousApiInterface";
import { Booking, ECDHData, SignedData, SignedQueueToken } from "./interfaces";

export interface UserApiInterface extends AnonymousApiInterface {
    cancelAppointment: ({
        providerID,
        id,
        signedTokenData,
    }: {
        providerID: string;
        id: string;
        signedTokenData: SignedData;
    }) => boolean;

    bookAppointment: ({
        providerID,
        id,
        encryptedData,
        signedTokenData,
    }: {
        providerID: string;
        id: string;
        encryptedData: ECDHData;
        signedTokenData: SignedData;
    }) => Booking;

    // get a token for a given queue
    getToken: ({
        hash,
        publicKey,
        code,
    }: {
        hash: string;
        publicKey: string;
        code?: string;
    }) => SignedQueueToken;
}
