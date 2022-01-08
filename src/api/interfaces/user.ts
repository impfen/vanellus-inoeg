// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { KeyPair, SignedData } from "./crypto";

export interface ActorKeyPairs {
    signing: KeyPair;
}

export interface UserKeyPairs extends ActorKeyPairs {
    encryption: KeyPair;
}

export type SignedUserToken = SignedData;

export interface QueueData {
    zipCode: string;
}

export interface ContactData {
    name?: string;
}

export interface UserToken {
    version: string;
    code: string;
    createdAt: string;
    publicKey: string; // the signing key to control the ID
    encryptionPublicKey: string;
}

export interface UserTokenData {
    keyPairs: UserKeyPairs;
    signedToken: SignedUserToken;
    userToken: UserToken;
}
