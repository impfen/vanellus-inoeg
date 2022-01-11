import { UserKeyPairs } from "../api/interfaces";
import { SignedData } from "../api/interfaces/crypto";

export interface UserToken {
    version: string;
    code: string;
    createdAt: string;
    publicKey: string; // the signing key to control the ID
    encryptionPublicKey: string;
}

export interface UserQueueToken {
    keyPairs: UserKeyPairs;
    signedToken: SignedData;
    userToken: UserToken;
    createdAt: string;
    hashNonce: string;
    dataHash: string;
}
