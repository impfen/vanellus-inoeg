import { SignedData } from "./interfaces";

export interface AdminApiInterface {
    resetDB: () => "ok";

    addMediatorPublicKeys: ({
        signedKeyData,
    }: {
        signedKeyData: SignedData;
    }) => "ok";
}
