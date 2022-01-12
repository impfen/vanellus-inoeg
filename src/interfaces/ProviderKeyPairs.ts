import { ActorKeyPairs, KeyPair } from "../api/interfaces";

export interface ProviderKeyPairs extends ActorKeyPairs {
    encryption: KeyPair;
    data: KeyPair;
    sync: string;
}
