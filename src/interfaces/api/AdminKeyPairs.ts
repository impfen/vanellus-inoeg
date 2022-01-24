// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { ActorKeyPairs } from "./ActorKeyPairs";
import type { KeyPair } from "./crypto";

export interface AdminKeyPairs extends ActorKeyPairs {
    signing: KeyPair;
    provider: KeyPair;
    token: KeyPair;
}
