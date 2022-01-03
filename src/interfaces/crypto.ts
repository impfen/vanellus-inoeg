// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

export interface KeyPair {
    publicKey: string // SPKI
    privateKey: JsonWebKey // JWK (due to Firefox not supporting PKCS8)
}

export interface AESData {
    iv: string
    data: string
}

export interface ECDHData {
    publicKey: string
    iv: string
    data: string
}

export interface SignedData {
    publicKey: string
    signature: string
    data: string
}

export interface KeyPairs {
    signing: KeyPair
    encryption: KeyPair
    sync: string
}
