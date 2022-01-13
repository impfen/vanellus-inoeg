// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { AESData } from "./crypto";

export interface Backup {
    createdAt: string;
    version: string;
    [Key: string]: unknown;
}

export type EncryptedBackup = AESData;
