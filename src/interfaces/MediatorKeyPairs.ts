// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ActorKeyPairs, KeyPair } from "../api/interfaces";

export interface MediatorKeyData {
    signing: string;
    encryption: string;
}

export interface MediatorKeyPairs extends ActorKeyPairs {
    encryption: KeyPair;
    provider: KeyPair;
}
