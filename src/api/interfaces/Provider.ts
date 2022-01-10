// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ECDHData, SignedData } from "./crypto";

export interface SignedProvider {
    signedData: SignedData;
    signedPublicData: SignedData;
}

export interface ApiEncryptedProvider {
    id: string;
    encryptedData: ECDHData;
}

export interface ApiSignedPublicProvider extends SignedData {
    id: string;
}
