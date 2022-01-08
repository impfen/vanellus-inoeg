// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ActorKeyPairs } from "./ActorKeyPairs";
import { KeyPair, SignedData } from "./crypto";

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
