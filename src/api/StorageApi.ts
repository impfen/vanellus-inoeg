import { VanellusError } from "../errors";
import { parseUntrustedJSON } from "../utils";
import { StorageApiInterface } from "./StorageApiInterface";
import { Transport } from "./transports";
import {
    aesDecrypt,
    aesEncrypt,
    b642buf,
    base322buf,
    deriveSecrets,
} from "./utils";

export class StorageApi {
    public constructor(
        protected readonly transport: Transport<StorageApiInterface>
    ) {}

    public async backup<Backup>(backupData: Backup, secret: string) {
        const [id, key] = await this.deriveSecret(secret);

        const encryptedData = await aesEncrypt(
            JSON.stringify(backupData),
            b642buf(key)
        );

        if (encryptedData === null) {
            throw new VanellusError("Could not backup data");
        }

        const response = await this.transport.call("storeSettings", {
            id: id,
            data: encryptedData,
        });

        if ("ok" !== response) {
            throw new VanellusError("Couldn't backup data");
        }

        return encryptedData;
    }

    public async restore<Backup>(secret: string) {
        const [id, key] = await this.deriveSecret(secret);

        const encryptedBackup = await this.transport.call("getSettings", {
            id: id,
        });

        const decryptedData = await aesDecrypt(encryptedBackup, b642buf(key));

        return parseUntrustedJSON<Backup>(decryptedData);
    }

    protected deriveSecret(secret: string) {
        return deriveSecrets(base322buf(secret), 32, 2);
    }
}
