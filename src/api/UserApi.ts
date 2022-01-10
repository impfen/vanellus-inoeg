import { VanellusError } from "../errors";
import { dayjs } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    Appointment,
    Booking,
    BookingData,
    ContactData,
    UserBackup,
    UserKeyPairs,
    UserQueueToken,
} from "./interfaces";
import { UserApiInterface } from "./UserApiInterface";
import {
    b642buf,
    encodeBase32,
    ephemeralECDHEncrypt,
    generateECDHKeyPair,
    generateECDSAKeyPair,
    randomBytes,
    sha256,
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
        userQueueToken: UserQueueToken
    ) {
        const providerData: BookingData = {
            signedToken: userQueueToken.signedToken,
            userToken: userQueueToken.userToken,
        };

        // we don't care about the ephmeral key
        const [encryptedData] = await ephemeralECDHEncrypt(
            JSON.stringify(providerData),
            appointment.publicKey
        );

        // we store the information about the offer which we've accepted
        const apiBooking = await this.transport.call(
            "bookAppointment",
            {
                id: appointment.id,
                providerID: appointment.provider.id,
                encryptedData: encryptedData,
                signedTokenData: userQueueToken.signedToken,
            },
            userQueueToken.keyPairs.signing
        );

        const booking: Booking = {
            id: apiBooking.id,
            code: userQueueToken.userToken.code,
        };

        return booking;
    }

    /**
     * Cancel an appointment
     *
     * @returns Promise<boolean>
     */
    public async cancelBooking(
        appointment: Appointment,
        userQueueToken: UserQueueToken
    ) {
        const result = await this.transport.call(
            "cancelAppointment",
            {
                id: appointment.id,
                providerID: appointment.provider.id,
                signedTokenData: userQueueToken.signedToken,
            },
            userQueueToken.keyPairs.signing
        );

        if ("ok" !== result) {
            throw new VanellusError("Could not cancel booking");
        }

        return true;
    }

    /**
     * get a token for a given queue
     *
     * @return Promise<UserQueueToken>
     */
    public async getQueueToken(
        secret: string,
        contactData: ContactData = {},
        code?: string
    ) {
        // we hash the user data to prove it didn't change later...
        const { hash, nonce } = await this.hashContactData(contactData);
        const keyPairs = await this.generateKeyPairs();

        const userToken = {
            version: "0.3",
            code: secret.slice(0, 4),
            createdAt: dayjs().utc().toISOString(),
            publicKey: keyPairs.signing.publicKey, // the signing key to control the ID
            encryptionPublicKey: keyPairs.encryption.publicKey,
        };

        const signedToken = await this.transport.call("getToken", {
            hash,
            publicKey: keyPairs.signing.publicKey,
            code: code,
        });

        const userQueueToken: UserQueueToken = {
            createdAt: dayjs().utc().toISOString(),
            signedToken: signedToken,
            keyPairs,
            hashNonce: nonce,
            dataHash: hash,
            userToken: userToken,
        };

        return userQueueToken;
    }

    /**
     * @todo finish implementation
     */
    public async backupData(
        userBackupData: UserBackup,
        secret: string
    ): Promise<boolean> {
        // storage-api

        return Promise.resolve(false);
    }

    /**
     * @todo finish implementation
     */
    public async restoreFromBackup(secret: string): Promise<UserBackup | null> {
        // storage-api
        return Promise.resolve(null);
    }

    /**
     * Generate a secret for the user
     *
     * @returns string
     */
    public generateSecret() {
        return encodeBase32(b642buf(randomBytes(10)));
    }

    /**
     * Generates all needed keypairs for the user.
     *
     * @returns Promise<UserKeyPairs>
     */
    public async generateKeyPairs() {
        const [signing, encryption] = await Promise.all([
            generateECDSAKeyPair(),
            generateECDHKeyPair(),
        ]);

        const keyPairs: UserKeyPairs = {
            signing,
            encryption,
        };

        return keyPairs;
    }

    /**
     * Hash contact-data so any tempering can be detected later
     */
    protected async hashContactData(contactData: ContactData) {
        const dataToHash = {
            name: contactData.name,
            nonce: randomBytes(32),
        };

        const dataHash = await sha256(JSON.stringify(dataToHash));

        return {
            hash: dataHash,
            nonce: dataToHash.nonce,
        };
    }
}
