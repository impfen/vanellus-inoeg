import { AnonymousApiInterface } from "./AnonymousApiInterface";
import { ApiEncryptedBooking, ECDHData, SignedData } from "./interfaces";

export interface UserApiInterface extends AnonymousApiInterface {
    cancelAppointment: ({
        providerID,
        id,
        signedTokenData,
    }: {
        providerID: string;
        id: string;
        signedTokenData: SignedData;
    }) => "ok";

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
    }) => ApiEncryptedBooking;

    // get a token for a given queue
    getToken: ({
        hash,
        publicKey,
        code,
    }: {
        hash: string;
        publicKey: string;
        code?: string;
    }) => SignedData;
}
