import { VanellusError } from "../errors";
import { Booking } from "../interfaces/Booking";
import { dayjs, parseUntrustedJSON } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import { ApiError, UnexpectedError } from "./errors";
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
    SignedProvider,
    Slot,
} from "./interfaces";
import { ProviderApiInterface } from "./ProviderApiInterface";
import { StorageApi } from "./StorageApi";
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
import { enrichAppointment, unenrichAppointment } from "./utils/appointment";

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
        providerKeyPairs: ProviderKeyPairs,
        properties?: Record<string, unknown>
    ) {
        const appointment: Appointment = {
            id: randomBytes(32),
            startDate: dayjs(startDate).utc().toDate(),
            endDate: dayjs(startDate).utc().add(duration, "minutes").toDate(),
            duration: duration,
            properties: { ...properties, vaccine: vaccine },
            slotData: this.createSlots(slotCount),
            publicKey: providerKeyPairs.encryption.publicKey,
            provider,
        };

        return appointment;
    }

    /**
     * Creates a series of appointments.
     * Mostly used in large vaccination-facilities.
     */
    public createAppointmentSeries(
        startAt: Date,
        endAt: Date,
        interval: number,
        slotCount: number,
        vaccine: string,
        provider: PublicProvider,
        providerKeyPairs: ProviderKeyPairs
    ) {
        if (startAt > endAt) {
            throw new VanellusError(
                "Can't end appointmentset set before it starts."
            );
        }

        if (startAt == endAt) {
            throw new VanellusError("Start and end can't be equal.");
        }

        let startDayjs = dayjs(startAt);
        const endDayjs = dayjs(endAt);

        const appointments: Appointment[] = [];

        do {
            appointments.push(
                this.createAppointment(
                    startDayjs.toDate(),
                    interval,
                    vaccine,
                    slotCount,
                    provider,
                    providerKeyPairs
                )
            );

            startDayjs = startDayjs.add(interval, "minute");
        } while (startDayjs < endDayjs);

        return appointments;
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

            const provider = parseUntrustedJSON<Provider>(
                apiProviderProviderAppointments.provider.data
            );

            const appointments = await Promise.all(
                apiProviderProviderAppointments.appointments.map(
                    async (signedAppointment) => {
                        const isVerified = await verify(
                            [providerKeyPairs.signing.publicKey],
                            signedAppointment
                        );

                        if (!isVerified) {
                            throw new UnexpectedError(
                                "Could not verify provider-appointment"
                            );
                        }

                        const apiAppointment =
                            parseUntrustedJSON<ApiAppointment>(
                                signedAppointment.data
                            );

                        const apiBookings = await this.decryptBookings(
                            signedAppointment.bookings || [],
                            providerKeyPairs
                        );

                        const bookings: Booking[] = apiBookings.map(
                            (apiBooking) => ({
                                id: apiBooking.id,
                                code: apiBooking.userToken.code,
                            })
                        );

                        const appointment: ProviderAppointment = {
                            ...enrichAppointment(apiAppointment, provider),
                            bookings,
                        };

                        return appointment;
                    }
                )
            );

            // needed as promise.all() does not guarantee order
            appointments.sort((a, b) => (a.startDate > b.startDate ? 1 : -1));

            return appointments;
        } catch (error) {
            if (error instanceof TransportError && error.code === 401) {
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
        // handle single appointments as well as arrays of appointments
        const unpublishedAppointments = Array.isArray(unpublishedAppointment)
            ? unpublishedAppointment
            : [unpublishedAppointment];

        const appointments: Appointment[] = [];

        const signedApiAppointments = await Promise.all(
            unpublishedAppointments.map(async (unpublishedAppointment) => {
                const apiAppointment = unenrichAppointment({
                    ...unpublishedAppointment,
                    publicKey: providerKeyPairs.encryption.publicKey,
                });

                /**
                 * we sign each appointment individually so that the client can verify that they've been posted by a valid provider
                 */
                const signedApiAppointment = await sign(
                    JSON.stringify(apiAppointment),
                    providerKeyPairs.signing.privateKey,
                    providerKeyPairs.signing.publicKey
                );

                appointments.push(unpublishedAppointment);

                return signedApiAppointment;
            })
        );

        await this.transport.call(
            "publishAppointments",
            {
                appointments: signedApiAppointments,
            },
            providerKeyPairs.signing
        );

        // needed as promise.all() does not guarantee order
        appointments.sort((a, b) => (a.startDate > b.startDate ? 1 : -1));

        return appointments;
    }

    /**
     * Cancles an appointment
     * This is simply done by emptying the slots of the appointment
     * and uploading it to the backend-server.
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
    public async storeProvider(
        providerInput: ProviderInput,
        providerKeyPairs: ProviderKeyPairs,
        signupCode?: string
    ) {
        const keys = await this.transport.call("getKeys");
        const id = await this.generateProviderId(providerKeyPairs);

        const providerData: Provider = {
            ...providerInput,
            id,
            publicKeys: {
                data: providerKeyPairs.data.publicKey,
                signing: providerKeyPairs.signing.publicKey,
                encryption: providerKeyPairs.encryption.publicKey,
            },
        };

        const encryptedData = await ecdhEncrypt(
            JSON.stringify(providerData),
            providerKeyPairs.data,
            keys.providerData
        );

        const result = await this.transport.call(
            "storeProviderData",
            {
                encryptedData: encryptedData,
                code: signupCode,
            },
            providerKeyPairs.signing
        );

        if ("ok" !== result) {
            throw new ApiError("Could not store provider");
        }

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
    public async checkProvider(providerKeyPairs: ProviderKeyPairs) {
        try {
            const signedData = await this.transport.call(
                "checkProviderData",
                undefined,
                providerKeyPairs.signing
            );

            const encryptedVerifiedProvider = parseUntrustedJSON<ECDHData>(
                signedData.data
            );

            // decrypt retrieved data, if any, with the providers private key
            const providerDataString = await ecdhDecrypt(
                encryptedVerifiedProvider,
                providerKeyPairs.data.privateKey
            );

            const decryptedProviderDataJSON =
                parseUntrustedJSON<SignedProvider>(providerDataString);

            const provider = parseUntrustedJSON<Provider>(
                decryptedProviderDataJSON.signedData.data
            );

            // const publicProvider = parseUntrustedJSON<Provider>(
            //     decryptedProviderDataJSON.signedPublicData.data
            // );

            return provider;
        } catch (error) {
            return null;
        }
    }

    /**
     *
     */
    public async backupData(providerBackup: ProviderBackup, secret: string) {
        const storage = new StorageApi(this.config);

        return storage.backup<ProviderBackup>(providerBackup, secret);
    }

    /**
     *
     */
    public async restoreFromBackup(secret: string) {
        const storage = new StorageApi(this.config);

        return storage.restore<ProviderBackup>(secret);
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

    protected generateProviderId(providerKeyPairs: ProviderKeyPairs) {
        return sha256(
            Buffer.from(providerKeyPairs.signing.publicKey, "base64")
        );
    }

    protected createSlots(count: number) {
        const slotData: Slot[] = [];

        for (let i = 0; i < count; i++) {
            slotData[i] = {
                id: randomBytes(32),
                open: true,
            };
        }

        return slotData;
    }
}
