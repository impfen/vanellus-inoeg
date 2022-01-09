import { AESData } from "./crypto";

export interface BackupData {
    createdAt: string;
    version: string;
    [Key: string]: unknown;
}

export type EncryptedBackup = AESData;
