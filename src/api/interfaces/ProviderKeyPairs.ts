import { ActorKeyPairs } from "./ActorKeyPairs";
import { KeyPair } from "./crypto";

export interface ProviderKeyPairs extends ActorKeyPairs {
    encryption: KeyPair;
    data: KeyPair;
    sync: string;
}
