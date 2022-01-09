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
    /**
     * Resets the appointment-db. Mainly used for testing
     *
     * @returns Promise<boolean>
     */
    async resetAppointmentsDb(adminKeyPairs: AdminKeyPairs) {
        const result = await this.transport.call(
            "resetDB",
            undefined,
            adminKeyPairs.signing
        );

        if ("ok" !== result) {
            throw new VanellusError("Could not add reset appointment-db");
        }

        return true;
    }

    /**
     * Generates all needed keypairs for a mediator
     *
     * @returns Promise<MediatorKeyPairs>
     */
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

    /**
     * Add a MediatorKeyPairs to the system.
     * Effectively, this method creates a mediator in the system.
     *
     * @returns Promise<boolean>
     */
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

        const result = await this.transport.call(
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

        if ("ok" !== result) {
            throw new VanellusError("Could not add mediator-key");
        }

        return true;
    }

    /**
     * Generates all needed keypairs for the admin
     * Needs the configured keys of the service-backend as input.
     *
     * @return Promise<AdminKeyPairs>
     */
    static async generateAdminKeys(adminConfig: AdminConfig) {
        const adminKeyPairs: AdminKeyPairs = {
            signing: await extractAdminKey(adminConfig, "root"),
            token: await extractAdminKey(adminConfig, "token"),
            provider: await extractAdminKey(adminConfig, "provider"),
        };

        return adminKeyPairs;
    }
}

const extractAdminKey = async (adminConfig: AdminConfig, name: string) => {
    const keyData = adminConfig.admin.signing.keys.find(
        (key) => key?.name === name
    );

    if (!keyData) {
        throw new VanellusError("Could not find signing-keys for admin");
    }

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
