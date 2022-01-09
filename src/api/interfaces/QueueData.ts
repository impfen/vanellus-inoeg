import { UserKeyPairs } from ".";
import { SignedData } from "./crypto";

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

export type ApiSignedQueueToken = SignedData;

export interface QueueToken {
    keyPairs: UserKeyPairs;
    signedToken: ApiSignedQueueToken;
    userToken: UserToken;
    createdAt: string;
    hashNonce: string;
    dataHash: string;
}
