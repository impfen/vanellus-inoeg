import { SignedMediatorKeyData } from "./interfaces";

export interface AdminApiInterface {
    resetDB: () => "ok";

    addMediatorPublicKeys: ({
        signedKeyData,
    }: {
        signedKeyData: SignedMediatorKeyData;
    }) => "ok";
}
