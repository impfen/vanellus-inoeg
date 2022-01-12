import { AESData } from "./crypto";

export interface Backup {
    createdAt: string;
    version: string;
    [Key: string]: unknown;
}

export type EncryptedBackup = AESData;
