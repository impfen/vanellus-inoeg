// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { UserToken } from "..";
import { ECDHData, SignedData } from "./crypto";

export interface ApiEncryptedBooking {
    id: string;
    publicKey: string;
    token: string;
    encryptedData: ECDHData;
}

export interface ApiBooking {
    id: string;
    publicKey: string;
    token: string;
    userToken: UserToken;
    signedToken: SignedData;
}

export interface BookingData {
    userToken: UserToken;
    signedToken: SignedData;
}
