// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { ApiEncryptedBooking, ECDHData, SignedData } from "../api";
import type { AnonymousApiInterface } from "./AnonymousApiInterface";

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
