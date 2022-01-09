import { ApiSignedQueueToken, UserToken } from ".";
import { Booking } from "../../interfaces";
import { ECDHData } from "./crypto";

export interface ApiEncryptedBooking extends Omit<Booking, "data"> {
    encryptedData: ECDHData;
}

export interface BookingData {
    userToken: UserToken;
    signedToken: ApiSignedQueueToken;
}
