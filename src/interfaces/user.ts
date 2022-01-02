// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { KeyPair, ECDHData, SignedData } from "./"

export interface QueueData {
    zipCode: string
}

export interface SignedToken extends SignedData {}

export interface ContactData {
    name?: string
}

export interface UserToken {
    version: string,
    code: string,
    createdAt: string,
    publicKey: string, // the signing key to control the ID
    encryptionPublicKey: string,
}

export interface TokenData {
    keyPairs: UserKeyPairs
    signedToken: SignedToken
    userToken: UserToken
}

export interface UserKeyPairs {
    signing: KeyPair
    encryption: KeyPair
}
