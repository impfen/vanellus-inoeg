import { dayjs } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    Appointment,
    ContactData,
    QueueToken,
    UserKeyPairs,
} from "./interfaces";
import { UserApiInterface } from "./UserApiInterface";
import {
    b642buf,
    buf2base32,
    ephemeralECDHEncrypt,
    generateECDHKeyPair,
    generateECDSAKeyPair,
    hash,
    randomBytes,
} from "./utils";

export class UserApi extends AbstractApi<
    AnonymousApiInterface & UserApiInterface,
    UserKeyPairs
> {
    /**
     * Book an appointment
     *
     * @returns Promise<Booking>
     */
    public async bookAppointment(
        appointment: Appointment,
        queueToken: QueueToken
    ) {
        const providerData = {
            signedToken: queueToken.signedToken,
            userToken: queueToken.userToken,
        };

        const encryptedDataAndPublicKey = await ephemeralECDHEncrypt(
            JSON.stringify(providerData),
            appointment.publicKey
        );

        // we don't care about the ephmeral key
        const [encryptedData] = encryptedDataAndPublicKey;

        // we store the information about the offer which we've accepted
        return this.transport.call(
            "bookAppointment",
            {
                id: appointment.id,
                providerID: appointment.provider.id,
                encryptedData: encryptedData,
                signedTokenData: queueToken.signedToken,
            },
            queueToken.keyPairs.signing
        );
    }

    /**
     *
     *
     * @returns Promise<boolean>
     */
    public async cancelAppointment(
        appointment: Appointment,
        queueToken: QueueToken
    ) {
        return this.transport.call(
            "cancelAppointment",
            {
                id: appointment.id,
                providerID: appointment.provider.id,
                signedTokenData: queueToken.signedToken,
            },
            queueToken.keyPairs.signing
        );
    }

    /**
     * get a token for a given queue
     *
     * @return Promise<QueueToken>
     */
    public async getQueueToken(
        contactData: ContactData,
        secret: string,
        code?: string
    ) {
        // we hash the user data to prove it didn't change later...
        const [dataHash, nonce] = await this.hashContactData(contactData);
        const signingKeyPair = await generateECDSAKeyPair();
        const encryptionKeyPair = await generateECDHKeyPair();

        const userToken = {
            version: "0.3",
            code: secret.slice(0, 4),
            createdAt: dayjs().utc().toISOString(),
            publicKey: signingKeyPair.publicKey, // the signing key to control the ID
            encryptionPublicKey: encryptionKeyPair.publicKey,
        };

        const signedToken = await this.transport.call("getToken", {
            hash: dataHash,
            publicKey: signingKeyPair.publicKey,
            code: code,
        });

        const queueToken: QueueToken = {
            createdAt: dayjs().utc().toISOString(),
            signedToken: signedToken,
            keyPairs: {
                signing: signingKeyPair,
                encryption: encryptionKeyPair,
            },
            hashNonce: nonce,
            dataHash: dataHash,
            userToken: userToken,
        };

        return queueToken;
    }

    /**
     * Generate a secret for the user
     *
     * @returns string
     */
    public generateSecret() {
        return buf2base32(b642buf(randomBytes(10)));
    }

    /**
     * Generates all needed keypairs for the user.
     *
     * @returns Promise<UserKeyPairs>
     */
    public async generateKeyPairs() {
        const signingKeyPair = await generateECDSAKeyPair();
        const encryptionKeyPair = await generateECDHKeyPair();

        const keyPairs: UserKeyPairs = {
            signing: signingKeyPair,
            encryption: encryptionKeyPair,
        };

        return keyPairs;
    }

    /**
     *
     */
    protected async hashContactData(data: ContactData) {
        const hashData = {
            name: data.name,
            nonce: randomBytes(32),
        };

        const hashDataJSON = JSON.stringify(hashData);
        const dataHash = await hash(hashDataJSON);

        return [dataHash, hashData.nonce];
    }
}
