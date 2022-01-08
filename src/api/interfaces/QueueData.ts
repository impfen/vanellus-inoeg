import { SignedData } from "./crypto";
import { UserKeyPairs } from "./UserKeyPairs";

export interface ContactData {
    name?: string;
}

export interface UserToken {
    version: string;
    code: string;
    createdAt: string;
    publicKey: string; // the signing key to control the ID
    encryptionPublicKey: string;
}

export interface QueueData {
    zipCode: string;
}

export type SignedQueueToken = SignedData;

export interface QueueToken {
    keyPairs: UserKeyPairs;
    signedToken: SignedQueueToken;
    userToken: UserToken;
    createdAt: string;
    hashNonce: string;
    dataHash: string;
}
