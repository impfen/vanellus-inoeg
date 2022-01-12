import { ActorKeyPairs } from "./ActorKeyPairs";
import { KeyPair } from "./crypto";

export interface AdminKeyPairs extends ActorKeyPairs {
    signing: KeyPair;
    provider: KeyPair;
    token: KeyPair;
}
