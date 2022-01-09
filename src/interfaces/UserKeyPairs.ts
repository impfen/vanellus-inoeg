import { ActorKeyPairs, KeyPair } from "../api/interfaces";

export interface UserKeyPairs extends ActorKeyPairs {
    encryption: KeyPair;
}
