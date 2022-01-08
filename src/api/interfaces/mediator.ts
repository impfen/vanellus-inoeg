// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { KeyPair, SignedData } from "./crypto";
import { ActorKeyPairs } from "./user";

export interface MediatorKeyData {
    signing: string;
    encryption: string;
}

export interface SignedMediatorKeyData extends SignedData {
    json?: MediatorKeyData;
}

export interface MediatorKeyPairs extends ActorKeyPairs {
    encryption: KeyPair;
    provider: KeyPair;
}
