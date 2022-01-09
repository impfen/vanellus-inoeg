import { ApiSignedQueueToken, UserToken } from "../api/interfaces";

export interface Booking {
    id: string;
    publicKey: string;
    token: string;
    userToken: UserToken;
    signedToken: ApiSignedQueueToken;
}
