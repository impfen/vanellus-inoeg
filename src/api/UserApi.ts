import { dayjs } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import { TransportError, UnexpectedError } from "./errors";
import {
    Booking,
    BookingData,
    ContactData,
    PublicAppointment,
    UserBackup,
    UserKeyPairs,
    UserQueueToken,
} from "./interfaces";
import { StorageApi } from "./StorageApi";
import { UserApiInterface } from "./UserApiInterface";
import {
    base64ToBuffer,
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
     * @returns Promise<Booking | null>
     */
    public async bookAppointment(
        appointment: PublicAppointment,
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

        try {
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
        } catch (error) {
            // Catch double bookings
            if (error instanceof TransportError && error?.code === 401) {
                return null;
            }

            throw error;
        }
    }

    /**
     * Cancel an appointment
     *
     * @returns Promise<boolean>
     */
    public async cancelBooking(
        appointment: PublicAppointment,
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
            throw new UnexpectedError("Couldn't cancel booking");
        }

        return true;
    }

    /**
     * get a token for a given queue
     *
     * @return Promise<UserQueueToken>
     */
    public async getQueueToken(
        userSecret: string,
        contactData: ContactData = {},
        code?: string
    ) {
        // we hash the user data to prove it didn't change later...
        const { hash, nonce } = await this.hashContactData(contactData);
        const keyPairs = await this.generateKeyPairs();

        const userToken = {
            version: "0.3",
            code: userSecret.slice(0, 4),
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
     *
     */
    public async backupData(userBackup: UserBackup, secret: string) {
        const storage = new StorageApi(this.config);

        return storage.backup<UserBackup>(userBackup, secret);
    }

    /**
     *
     */
    public async restoreFromBackup(secret: string) {
        const storage = new StorageApi(this.config);

        return storage.restore<UserBackup>(secret);
    }

    /**
     * Generate a secret for the user
     *
     * @returns string
     */
    public generateSecret() {
        return encodeBase32(base64ToBuffer(randomBytes(10)));
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

        const userKeyPairs: UserKeyPairs = {
            signing,
            encryption,
        };

        return userKeyPairs;
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
