// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import dayjs from "dayjs";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApi } from "./AnonymousApi";
import { TransportError, UnexpectedError } from "./errors";
import type {
    Booking,
    BookingData,
    ContactData,
    PublicAppointment,
    UserBackup,
    UserKeyPairs,
    UserQueueToken,
} from "./interfaces";
import { BookingStatus } from "./interfaces";
import type {
    AnonymousApiInterface,
    UserApiInterface,
} from "./interfaces/endpoints";
import { StorageApi } from "./StorageApi";
import {
    base64ToBuffer,
    encodeBase32,
    ephemeralECDHEncrypt,
    generateECDHKeyPair,
    generateECDSAKeyPair,
    randomBytes,
    sha256,
} from "./utils";

export class UserApi<Vaccine = string> extends AbstractApi<
    AnonymousApiInterface & UserApiInterface,
    UserKeyPairs
> {
    /**
     * Book an appointment
     *
     * @returns Promise<Booking>
     */
    public async bookAppointment(
        appointment: PublicAppointment<Vaccine>,
        userQueueToken: UserQueueToken
    ) {
        const providerData: BookingData = {
            signedToken: userQueueToken.signedToken,
            userToken: userQueueToken.userToken,
        };

        // we don't care about the ephemeral key
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

            const booking: Booking<Vaccine> = {
                slotId: apiBooking.id,
                token: userQueueToken.userToken,
                signedToken: userQueueToken.signedToken,
                keyPairs: userQueueToken.keyPairs,
                appointment,
            };

            return booking;
        } catch (error) {
            // Catch double bookings
            if (error instanceof TransportError && error?.code === 401) {
                throw new UnexpectedError("Double booking detected");
            }

            throw error;
        }
    }

    /**
     * Cancel an appointment
     *
     * @returns Promise<boolean>
     */
    public async cancelBooking(booking: Booking<Vaccine>) {
        const result = await this.transport.call(
            "cancelAppointment",
            {
                id: booking.appointment.id,
                providerID: booking.appointment.provider.id,
                signedTokenData: booking.signedToken,
            },
            booking.keyPairs.signing
        );

        if ("ok" !== result) {
            throw new UnexpectedError("Couldn't cancel booking");
        }

        return true;
    }

    /**
     * Checks the status of a given Booking
     *
     * Get's the appointment from the system, validates its signature and retuns the status
     *
     * @returns Promise<BookingStatus>
     */
    public async checkBookingStatus(booking: Booking<Vaccine>) {
        const anonApi = new AnonymousApi(this.config);

        const appointment = await anonApi.getAppointment(
            booking.appointment.id,
            booking.appointment.provider.id
        );

        const slot = appointment.slotData.find(
            (slot) => slot.id === booking.slotId
        );

        if (slot && false === slot.open) {
            // the booking is valid
            return BookingStatus.VALID;
        }

        if (slot && true === slot.open) {
            // the user canceled the booking
            // (or never booked in the first place and the input was bogus...)
            return BookingStatus.USER_CANCELED;
        }

        if (!slot) {
            // the provider canceled the appointment
            return BookingStatus.PROVIDER_CANCELED;
        }

        // should never occur...
        return BookingStatus.UNKNOWN;
    }

    /**
     * Get a token for a given user.
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
            createdAt: dayjs.utc().toISOString(),
            publicKey: keyPairs.signing.publicKey, // the signing key to control the ID
            encryptionPublicKey: keyPairs.encryption.publicKey,
        };

        const signedToken = await this.transport.call("getToken", {
            hash,
            publicKey: keyPairs.signing.publicKey,
            code: code,
        });

        const userQueueToken: UserQueueToken = {
            createdAt: dayjs.utc().toISOString(),
            signedToken: signedToken,
            keyPairs,
            hashNonce: nonce,
            dataHash: hash,
            userToken: userToken,
        };

        return userQueueToken;
    }

    /**
     * checks if the backend recognizes the signed user token
     *
     * @returns Promise<boolean>
     */
    public async isValidToken(userQueueToken: UserQueueToken) {
        const result = await this.transport.call(
            "isValidUser",
            {
                signedTokenData: userQueueToken.signedToken,
            },
            userQueueToken.keyPairs.signing
        );

        return result;
    }

    /**
     * Backups relevant data of the user into the storage backend.
     * Used for persistance.
     *
     * The data is automatically deleted after 30 days of inactivity.
     *
     * @returns Promise<AESData>
     */
    public async backupData(userBackup: UserBackup, secret: string) {
        const storage = new StorageApi(this.config);

        return storage.backup<UserBackup>(userBackup, secret);
    }

    /**
     * Restores relevant data of the user from the storage backend.
     * Used for persistance.
     *
     * @returns Promise<UserBackup>
     */
    public async restoreFromBackup(secret: string) {
        const storage = new StorageApi(this.config);

        return storage.restore<UserBackup<Vaccine>>(secret);
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
