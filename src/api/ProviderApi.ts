import { Booking } from "../interfaces/Booking";
import { dayjs, parseUntrustedJSON } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import { ApiError } from "./errors";
import { TransportError } from "./errors/TransportError";
import {
    ApiAppointment,
    ApiBooking,
    ApiEncryptedBooking,
    Appointment,
    BookingData,
    ECDHData,
    Provider,
    ProviderAppointment,
    ProviderBackup,
    ProviderInput,
    ProviderKeyPairs,
    PublicProvider,
    SignedData,
    SignedProvider,
} from "./interfaces";
import { ProviderApiInterface } from "./ProviderApiInterface";
import {
    b642buf,
    ecdhDecrypt,
    ecdhEncrypt,
    encodeBase32,
    generateECDHKeyPair,
    generateECDSAKeyPair,
    generateSymmetricKey,
    randomBytes,
    sha256,
    sign,
    verify,
} from "./utils";
import { createAppointment, enrichAppointment } from "./utils/appointment";

export class ProviderApi extends AbstractApi<
    AnonymousApiInterface & ProviderApiInterface,
    ProviderKeyPairs
> {
    /**
     * creates an initial Appointment object
     *
     * @param duration  length of the appointment in minutes
     * @param vaccine   vaccine offered at the appointment
     * @param slotCount number of people that can be vaccinated
     * @param startDate startDate of the appointment
     *
     * @return Appointment
     */
    public createAppointment(
        startDate: Date,
        duration: number,
        vaccine: string,
        slotCount: number,
        provider: PublicProvider,
        providerKeyPairs: ProviderKeyPairs
    ) {
        const appointment: Appointment = createAppointment(
            startDate,
            duration,
            slotCount,
            vaccine,
            provider,
            providerKeyPairs
        );

        return appointment;
    }

    /**
     * Retrieves the appointments which belong to the provider
     * Returns an empty array if the provider is not verified.
     *
     * @return Promise<ProviderAppointment[]>
     */
    public async getProviderAppointments(
        from: Date,
        to: Date,
        providerKeyPairs: ProviderKeyPairs
    ) {
        try {
            const apiProviderProviderAppointments = await this.transport.call(
                "getProviderAppointments",
                {
                    from: dayjs(from).toISOString(),
                    to: dayjs(to).toISOString(),
                },
                providerKeyPairs.signing
            );

            const appointments: ProviderAppointment[] = [];

            const provider = parseUntrustedJSON<Provider>(
                apiProviderProviderAppointments.provider.data
            );

            for (const signedAppointment of apiProviderProviderAppointments.appointments) {
                const isVerified = await verify(
                    [providerKeyPairs.signing.publicKey],
                    signedAppointment
                );

                if (!isVerified) {
                    throw new ApiError("Could not verify provider-appointment");
                }

                const apiAppointment = parseUntrustedJSON<ApiAppointment>(
                    signedAppointment.data
                );

                const apiBookings = await this.decryptBookings(
                    signedAppointment.bookings || [],
                    providerKeyPairs
                );

                const bookings: Booking[] = apiBookings.map((apiBooking) => ({
                    id: apiBooking.id,
                    code: apiBooking.userToken.code,
                }));

                const appointment: ProviderAppointment = {
                    ...enrichAppointment(apiAppointment, provider),
                    bookings,
                };

                appointments.push(appointment);
            }

            return appointments;
        } catch (error) {
            if (error instanceof TransportError && error.code === 403) {
                // the provider is unverified
                return [];
            }

            throw error;
        }
    }

    /**
     * Publish appointments to the backend
     *
     * @return Promise<Appointment[]>
     */
    public async publishAppointments(
        unpublishedAppointment: Appointment[] | Appointment,
        providerKeyPairs: ProviderKeyPairs
    ) {
        const signedApiAppointments: SignedData[] = [];
        const appointments: Appointment[] = [];

        const unpublishedAppointments = Array.isArray(unpublishedAppointment)
            ? unpublishedAppointment
            : [unpublishedAppointment];

        for (const unpublishedAppointment of unpublishedAppointments) {
            const apiAppointment: ApiAppointment = {
                id: unpublishedAppointment.id,
                timestamp: dayjs(unpublishedAppointment.startDate)
                    .utc()
                    .toISOString(),
                duration: unpublishedAppointment.duration,
                properties: unpublishedAppointment.properties,
                publicKey: providerKeyPairs.encryption.publicKey,
                slotData: unpublishedAppointment.slotData,
            };

            /**
             * we sign each appointment individually so that the client can verify that they've been posted by a valid provider
             */
            const signedApiAppointment = await sign(
                JSON.stringify(apiAppointment),
                providerKeyPairs.signing.privateKey,
                providerKeyPairs.signing.publicKey
            );

            appointments.push(unpublishedAppointment);

            signedApiAppointments.push(signedApiAppointment);
        }

        await this.transport.call(
            "publishAppointments",
            {
                appointments: signedApiAppointments,
            },
            providerKeyPairs.signing
        );

        return appointments;
    }

    /**
     * Cancles an appointment by emptying the slots of the appointment and uploading
     * to server
     *
     * @return Promise<Appointment[]>
     */
    public async cancelAppointment(
        appointment: Appointment,
        keyPairs: ProviderKeyPairs
    ) {
        appointment.slotData = [];

        return this.publishAppointments([appointment], keyPairs);
    }

    /**
     * Stores a provider for initial signup or save after a change of data
     *
     * @param providerInput     Data to save
     * @param providerKeyPairs  KeyPairs of the provider to store
     * @param signupCode        Optional signup code
     *
     * @returns Promise<Provider>
     */
    public async storeUnverifiedProvider(
        providerInput: ProviderInput,
        providerKeyPairs: ProviderKeyPairs,
        signupCode?: string
    ) {
        const keys = await this.transport.call("getKeys");
        const id = await sha256(
            Buffer.from(providerKeyPairs.signing.publicKey, "base64")
        );

        const providerData: Provider = Object.assign(
            {},
            {
                id,
                ...providerInput,
                publicKeys: {
                    data: providerKeyPairs.data.publicKey,
                    signing: providerKeyPairs.signing.publicKey,
                    encryption: providerKeyPairs.encryption.publicKey,
                },
            }
        );

        const encryptedData = await ecdhEncrypt(
            JSON.stringify(providerData),
            providerKeyPairs.data,
            keys.providerData
        );

        await this.transport.call(
            "storeProviderData",
            {
                encryptedData: encryptedData,
                code: signupCode,
            },
            providerKeyPairs.signing
        );

        return providerData;
    }

    /**
     * Checks if a provider is verified and, if yes, returns the verified data.
     * If the current provider, who provided the keys, is not verified yet, null is returned.
     *
     * @todo check signature of retrieved ProviderData
     *
     * @return Promise<Provider | null>
     */
    public async getVerifiedProvider(providerKeyPairs: ProviderKeyPairs) {
        try {
            const encryptedVerifiedProviderECDAData = await this.transport.call(
                "checkProviderData",
                undefined,
                providerKeyPairs.signing
            );

            const encryptedVerifiedProvider = parseUntrustedJSON<ECDHData>(
                encryptedVerifiedProviderECDAData.data
            );

            // decrypt retrieved data, if any, with the providers private key
            const decryptedProviderDataString = await ecdhDecrypt(
                encryptedVerifiedProvider,
                providerKeyPairs.data.privateKey
            );

            const decryptedProviderDataJSON =
                parseUntrustedJSON<SignedProvider>(decryptedProviderDataString);

            const providerWithoutPublicKeys = parseUntrustedJSON<
                Omit<Provider, "publicKeys">
            >(decryptedProviderDataJSON.signedPublicData.data);

            const provider: Provider = {
                ...providerWithoutPublicKeys,
                publicKeys: {
                    data: providerKeyPairs.data.publicKey,
                    signing: providerKeyPairs.signing.publicKey,
                    encryption: providerKeyPairs.encryption.publicKey,
                },
            };

            return provider;
        } catch (error) {
            return null;
        }
    }

    /**
     * @todo finish implementation
     */
    public async backupData(
        providerBackup: ProviderBackup,
        secret: string
    ): Promise<boolean> {
        // storage-api

        return Promise.resolve(false);
    }

    /**
     * @todo finish implementation
     */
    public async restoreFromBackup(
        secret: string
    ): Promise<ProviderBackup | null> {
        // storage-api
        return Promise.resolve(null);
    }

    /**
     * Generates all needed keypairs for the provider
     *
     * @return Promise<ProviderKeyPairs>
     */
    public async generateKeyPairs() {
        const [sync, data, signing, encryption] = await Promise.all([
            generateSymmetricKey(),
            generateECDHKeyPair(),
            generateECDSAKeyPair(),
            generateECDHKeyPair(),
        ]);

        const keyPairs: ProviderKeyPairs = {
            sync,
            signing,
            data,
            encryption,
        };

        return keyPairs;
    }

    /**
     * Generates a provider-secret
     *
     * @returns string
     */
    public generateSecret() {
        return encodeBase32(b642buf(randomBytes(15)));
    }

    /**
     * Decrypt a booking
     *
     * @returns Promise<Booking[]>
     */
    protected async decryptBookings(
        encryptedBookings: ApiEncryptedBooking[],
        providerKeyPairs: ProviderKeyPairs
    ) {
        return Promise.all(
            encryptedBookings.map(async ({ encryptedData, ...restBooking }) => {
                const decryptedDataString = await ecdhDecrypt(
                    encryptedData,
                    providerKeyPairs.encryption.privateKey
                );

                const decryptedBooking =
                    parseUntrustedJSON<BookingData>(decryptedDataString);

                const booking: ApiBooking = {
                    id: restBooking.id,
                    publicKey: restBooking.publicKey,
                    token: restBooking.token,
                    ...decryptedBooking,
                };

                return booking;
            })
        );
    }
}
