// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ActorKeyPairs } from "./ActorKeyPairs";
import { KeyPair } from "./crypto";

export interface UserKeyPairs extends ActorKeyPairs {
    encryption: KeyPair;
}
