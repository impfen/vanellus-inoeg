// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { KeyPair } from "./"

export interface MediatorKeyData {
    signing: string
    encryption: string
}

export interface SignedMediatorKeyData {
    data: string
    signature: string
    publicKey: string
    json?: MediatorKeyData
}

export interface MediatorKeyPairs {
    encryption: KeyPair
    signing: KeyPair
    provider: KeyPair
}
