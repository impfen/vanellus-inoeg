import { ActorKeyPairs } from ".";
import { KeyPair } from "./crypto";

export interface AdminKeyPairs extends ActorKeyPairs {
    signing: KeyPair;
    provider: KeyPair;
    token: KeyPair;
}

export interface AdminConfig {
    admin: {
        signing: {
            keys: {
                name: string;
                type: string;
                format: string;
                params: Record<string, string>;
                publicKey: string;
                purposes: string[];
                privateKey: string;
            }[];
        };
    };
}
