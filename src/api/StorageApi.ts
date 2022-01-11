import { Config } from "../interfaces";
import { parseUntrustedJSON } from "../utils";
import { UnexpectedError } from "./errors";
import { AdminKeyPairs } from "./interfaces";
import { StorageApiInterface } from "./StorageApiInterface";
import { JsonRpcTransport, Transport } from "./transports";
import {
    aesDecrypt,
    aesEncrypt,
    b642buf,
    decodeBase32,
    deriveSecrets,
    str2ab,
} from "./utils";

export class StorageApi {
    protected transport: Transport<StorageApiInterface>;

    public constructor(config: Config) {
        this.transport = new JsonRpcTransport<StorageApiInterface>(
            config.endpoints.storage
        );
    }

    public async backup<Backup>(backupData: Backup, secret: string) {
        const [id, key] = await this.deriveSecret(secret);

        const encryptedData = await aesEncrypt(
            JSON.stringify(backupData),
            b642buf(key)
        );

        if (encryptedData === null) {
            throw new UnexpectedError("Couldn't encrypt backup data");
        }

        const response = await this.transport.call("storeSettings", {
            id: id,
            data: encryptedData,
        });

        if ("ok" !== response) {
            throw new UnexpectedError("Couldn't save backup");
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

    public async delete(secret: string) {
        const [id] = await this.deriveSecret(secret);

        const response = await this.transport.call("deleteSettings", {
            id: id,
        });

        if ("ok" !== response) {
            throw new UnexpectedError("Couldn't delete backup");
        }

        return true;
    }

    public async resetDb(adminKeyPairs: AdminKeyPairs) {
        const result = await this.transport.call(
            "resetDB",
            undefined,
            adminKeyPairs.signing
        );

        if ("ok" !== result) {
            throw new UnexpectedError("Could not add reset storage");
        }

        return true;
    }

    protected deriveSecret(secret: string) {
        return deriveSecrets(str2ab(decodeBase32(secret)), 32, 2);
    }
}
