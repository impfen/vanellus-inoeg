// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { SignedData } from "./api";
import type { UserKeyPairs } from "./UserKeyPairs";

export interface UserToken {
    version: string;
    code: string;
    createdAt: string;
    publicKey: string; // the signing key to control the ID
    encryptionPublicKey: string;
}

export interface UserQueueToken {
    keyPairs: UserKeyPairs;
    signedToken: SignedData;
    userToken: UserToken;
    createdAt: string;
    hashNonce: string;
    dataHash: string;
}
