// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { UnexpectedError } from "./errors";
import type { AdminKeyPairs, VanellusConfig } from "./interfaces";
import type { StorageApiInterface } from "./interfaces/endpoints";
import { JsonRpcTransport, type Transport } from "./transports";
import {
    aesDecrypt,
    aesEncrypt,
    base64ToBuffer,
    decodeBase32,
    deriveSecrets,
    parseUntrustedJSON,
    stringToArrayBuffer,
} from "./utils";

export class StorageApi {
    protected transport: Transport<StorageApiInterface>;

    public constructor(config: VanellusConfig) {
        this.transport = new JsonRpcTransport<StorageApiInterface>(
            config.jsonrpc.storage
        );
    }

    public async backup<Backup>(backupData: Backup, secret: string) {
        const [id, key] = await this.deriveSecret(secret);

        const encryptedData = await aesEncrypt(
            JSON.stringify(backupData),
            base64ToBuffer(key)
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

        const decryptedData = await aesDecrypt(
            encryptedBackup,
            base64ToBuffer(key)
        );

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
        return deriveSecrets(stringToArrayBuffer(decodeBase32(secret)), 32, 2);
    }
}
