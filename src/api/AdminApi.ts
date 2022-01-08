import { VanellusError } from "../errors";
import { AbstractApi } from "./AbstractApi";
import { AdminApiInterface } from "./AdminApiInterface";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    AdminConfig,
    AdminKeyPairs,
    MediatorKeyData,
    MediatorKeyPairs,
} from "./interfaces";
import {
    b642buf,
    generateECDHKeyPair,
    generateECDSAKeyPair,
    sign,
} from "./utils";

export class AdminApi extends AbstractApi<
    AnonymousApiInterface & AdminApiInterface,
    AdminKeyPairs
> {
    static async generateAdminKeys(adminConfig: AdminConfig) {
        return {
            signing: await extractAdminKey(adminConfig, "root"),
            token: await extractAdminKey(adminConfig, "token"),
            provider: await extractAdminKey(adminConfig, "provider"),
        };
    }

    async resetAppointmentsDb(adminKeyPairs: AdminKeyPairs) {
        return this.transport.call("resetDB", undefined, adminKeyPairs.signing);
    }

    // async resetStorageDb() {
    //     return backend.storage.resetDB({}, this.adminKeys.root)
    // }

    async generateMediatorKeys(adminKeyPairs: AdminKeyPairs) {
        const signingKeyPair = await generateECDSAKeyPair();
        const encryptionKeyPair = await generateECDHKeyPair();

        const mediatorKeyPairs: MediatorKeyPairs = {
            signing: signingKeyPair,
            encryption: encryptionKeyPair,
            provider: adminKeyPairs.provider,
        };

        return mediatorKeyPairs;
    }

    async addMediatorPublicKeys(
        mediatorKeyPairs: MediatorKeyPairs,
        adminKeyPairs: AdminKeyPairs
    ) {
        const mediatorKeyData: MediatorKeyData = {
            signing: mediatorKeyPairs.signing.publicKey,
            encryption: mediatorKeyPairs.encryption.publicKey,
        };

        const signedData = await sign(
            JSON.stringify(mediatorKeyData),
            adminKeyPairs.signing.privateKey,
            adminKeyPairs.signing.publicKey
        );

        return this.transport.call(
            "addMediatorPublicKeys",
            {
                signedKeyData: {
                    publicKey: signedData.publicKey,
                    signature: signedData.signature,
                    data: signedData.data,
                },
            },

            adminKeyPairs.signing
        );
    }
}

const extractAdminKey = async (adminConfig: AdminConfig, name: string) => {
    const keyData = adminConfig.admin.signing.keys.find(
        (key) => key?.name === name
    );

    if (!keyData) {
        throw new VanellusError("Could not find signing-keys for admin");
    }

    // this will not work in Firefox, but that's ok as it's only for testing...
    const importedKey = await crypto.subtle.importKey(
        "pkcs8",
        b642buf(keyData.privateKey),
        {
            name: keyData.type === "ecdh" ? "ECDH" : "ECDSA",
            namedCurve: "P-256",
        },
        true,
        keyData.type === "ecdh" ? ["deriveKey"] : ["sign"]
    );

    // we reexport as JWK as that's the format that the library expects...
    const privateKey = await crypto.subtle.exportKey("jwk", importedKey);

    return {
        publicKey: keyData.publicKey,
        privateKey: privateKey,
    };
};
