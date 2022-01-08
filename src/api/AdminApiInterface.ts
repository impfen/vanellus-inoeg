import { SignedMediatorKeyData } from "./interfaces";

export interface AdminApiInterface {
    resetDB: () => boolean;

    addMediatorPublicKeys: ({
        signedKeyData,
    }: {
        signedKeyData: SignedMediatorKeyData;
    }) => boolean;
}
