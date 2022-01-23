// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { AbstractApi } from "./AbstractApi";
import {
    ApiError,
    TransportError,
    UnexpectedError,
    VanellusError,
} from "./errors";
import {
    ApiAppointment,
    ApiBooking,
    ApiEncryptedBooking,
    ApiProviderProviderAppointments,
    ApiSignedProviderAppointment,
    Appointment,
    AppointmentStatus,
    BookingData,
    ECDHData,
    Provider,
    ProviderBackup,
    ProviderBooking,
    ProviderInput,
    ProviderKeyPairs,
    PublicAppointment,
    PublicProvider,
    SignedProvider,
    Slot,
    UnpublishedAppointmentSeries,
    UnpublishedPublicAppointment,
    Vaccine,
} from "./interfaces";
import type { ProviderApiInterface } from "./interfaces/endpoints";
import { StorageApi } from "./StorageApi";
import {
    base64ToBuffer,
    dayjs,
    ecdhDecrypt,
    ecdhEncrypt,
    encodeBase32,
    enrichAppointment,
    generateECDHKeyPair,
    generateECDSAKeyPair,
    generateSymmetricKey,
    parseUntrustedJSON,
    randomBytes,
    sha256,
    sign,
    unenrichAppointment,
    verify,
} from "./utils";

export class ProviderApi extends AbstractApi<
    ProviderApiInterface,
    ProviderKeyPairs
> {
    /**
     * creates an initial Appointment object
     *
     * @param start     start of the appointment
     * @param duration  length of the appointment in minutes
     * @param vaccine   vaccine offered at the appointment
     * @param slotCount number of people that can be vaccinated
     
     *
     * @return Appointment
     */
    public createAppointment(
        start: Date,
        duration: number,
        vaccine: Vaccine,
        slotCount: number,
        provider: PublicProvider,
        providerKeyPairs: ProviderKeyPairs,
        properties?: Record<string, unknown>
    ) {
        const appointment: UnpublishedPublicAppointment = {
            id: randomBytes(32),
            startDate: dayjs(start).utc().toDate(),
            endDate: dayjs(start).utc().add(duration, "minutes").toDate(),
            duration: duration,
            properties: { ...properties, vaccine },
            slotData: this.createSlots(slotCount),
            publicKey: providerKeyPairs.encryption.publicKey,
            provider,
            unpublished: true,
        };

        return appointment;
    }

    /**
     * Creates a series of appointments.
     *
     * Mostly used in large vaccination-facilities.
     */
    public createAppointmentSeries(
        startAt: Date,
        endAt: Date,
        interval: number,
        slotCount: number,
        vaccine: Vaccine,
        provider: PublicProvider,
        providerKeyPairs: ProviderKeyPairs
    ) {
        if (startAt > endAt) {
            throw new VanellusError(
                "Can't end appointment-series before it starts."
            );
        }

        if (startAt == endAt) {
            throw new VanellusError("Start and end can't be equal.");
        }

        const appointments: UnpublishedPublicAppointment[] = [];

        const seriesId = randomBytes(16);

        let startDayjs = dayjs(startAt).utc();
        const endDayjs = dayjs(endAt).utc();

        do {
            appointments.push(
                this.createAppointment(
                    startDayjs.toDate(),
                    interval,
                    vaccine,
                    slotCount,
                    provider,
                    providerKeyPairs,
                    {
                        seriesId,
                    }
                )
            );

            startDayjs = startDayjs.add(interval, "minutes");
        } while (startDayjs.isBefore(endDayjs, "minutes"));

        const appointmentSeries: UnpublishedAppointmentSeries = {
            id: seriesId,
            startAt,
            endAt,
            interval,
            vaccine,
            slotCount,
            provider,
            appointments,
        };

        return appointmentSeries;
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

            return await this.processApiAppointments(
                apiProviderProviderAppointments,
                providerKeyPairs
            );
        } catch (error) {
            if (error instanceof TransportError && error.code === 401) {
                // the provider is unverified
                return [];
            }

            throw error;
        }
    }

    /**
     * Retrieves the appointments which belong to the provider and have a
     * specific property.
     * Returns an empty array if the provider is not verified.
     *
     * Mainly used to retrieve complete appointment-series.
     *
     * @return Promise<ProviderAppointment[]>
     */
    public async getProviderAppointmentsByProperty(
        key: string,
        value: string,
        providerKeyPairs: ProviderKeyPairs
    ) {
        try {
            const apiProviderProviderAppointments = await this.transport.call(
                "getProviderAppointmentsByProperty",
                {
                    key: key,
                    value: value,
                },
                providerKeyPairs.signing
            );

            return await this.processApiAppointments(
                apiProviderProviderAppointments,
                providerKeyPairs
            );
        } catch (error) {
            if (error instanceof TransportError && error.code === 401) {
                // the provider is unverified
                return [];
            }

            throw error;
        }
    }

    /**
     * Publish appointments
     *
     * @return Promise<PublicAppointment[]>
     */
    public async publishAppointments(
        unpublishedAppointment:
            | UnpublishedPublicAppointment[]
            | UnpublishedPublicAppointment,
        providerKeyPairs: ProviderKeyPairs
    ) {
        // handle single appointments as well as arrays of appointments
        const unpublishedAppointments = Array.isArray(unpublishedAppointment)
            ? unpublishedAppointment
            : [unpublishedAppointment];

        const appointments: PublicAppointment[] = [];

        const signedApiAppointments = await Promise.all(
            unpublishedAppointments.map(async (unpublishedAppointment) => {
                const apiAppointment = unenrichAppointment({
                    ...unpublishedAppointment,
                    // we set the publicKey of the current provider. Just to be 100% sure.
                    publicKey: providerKeyPairs.encryption.publicKey,
                });

                /**
                 * we sign each appointment individually so that the client can
                 * verify that they've been posted by a valid provider
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
     * Update an appointment
     *
     * ATM simply update the properties of the appointment and republish it.
     *
     * @todo improve logic, clearify inner logic
     * @see  https://github.com/impfen/services-inoeg/issues/16
     *
     * @return Promise<PublicAppointment>
     */
    public async updateAppointment(
        appointment: PublicAppointment,
        providerKeyPairs: ProviderKeyPairs
    ) {
        // Little hack to use TS as typeguard on the publishAppointment()-method
        // and get some more control over the data-flow
        const unpublishedAppointment: UnpublishedPublicAppointment = {
            ...appointment,
            unpublished: true,
        };

        const canceledAppointments = await this.publishAppointments(
            unpublishedAppointment,
            providerKeyPairs
        );

        return canceledAppointments[0];
    }

    /**
     * Cancel an appointment
     *
     * This is simply done by emptying the slots of the appointment
     * and uploading it to the backend-server.
     *
     * @return Promise<PublicAppointment>
     */
    public async cancelAppointment(
        appointment: PublicAppointment,
        providerKeyPairs: ProviderKeyPairs
    ) {
        // Little hack to use TS as typeguard on the publishAppointment()-method
        // and get some more control over the data-flow
        const unpublishedAppointment: UnpublishedPublicAppointment = {
            ...appointment,
            slotData: [],
            unpublished: true,
        };

        const canceledAppointments = await this.publishAppointments(
            unpublishedAppointment,
            providerKeyPairs
        );

        return canceledAppointments[0];
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
        const systemPublicKeys = await this.transport.call("getKeys");
        const id = await this.generateProviderId(providerKeyPairs);

        const providerData: Provider = {
            id,
            ...providerInput,
            verified: false,
            publicKeys: {
                data: providerKeyPairs.data.publicKey,
                signing: providerKeyPairs.signing.publicKey,
                encryption: providerKeyPairs.encryption.publicKey,
            },
        };

        const encryptedData = await ecdhEncrypt(
            JSON.stringify(providerData),
            providerKeyPairs.data,
            systemPublicKeys.providerData
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
     * @return Promise<ProviderData>
     */
    public async checkProvider(providerKeyPairs: ProviderKeyPairs) {
        try {
            const signedProvider = await this.transport.call(
                "checkProviderData",
                undefined,
                providerKeyPairs.signing
            );

            const encryptedVerifiedProvider = parseUntrustedJSON<ECDHData>(
                signedProvider.data
            );

            // decrypt retrieved data, if any, with the providers private key
            const providerDataString = await ecdhDecrypt(
                encryptedVerifiedProvider,
                providerKeyPairs.data.privateKey
            );

            const decryptedProviderDataJSON =
                parseUntrustedJSON<SignedProvider>(providerDataString);

            const verifiedProvider = parseUntrustedJSON<Provider>(
                decryptedProviderDataJSON.signedData.data
            );

            const publicProvider = parseUntrustedJSON<Provider>(
                decryptedProviderDataJSON.signedPublicData.data
            );

            return {
                verifiedProvider,
                publicProvider,
            };
        } catch (error) {
            return {
                verifiedProvider: null,
                publicProvider: null,
            };
        }
    }

    /**
     * Checks if the backend recognizes our id as a provider id
     *
     * @return Promise<boolean>
     */
    public async isValidKeyPairs(providerKeyPairs: ProviderKeyPairs) {
        return this.transport.call(
            "isValidProvider",
            undefined,
            providerKeyPairs.signing
        );
    }

    /**
     * Backups relevant data of the provider into the storage backend.
     * Used for persistance.
     *
     * The data is automatically deleted after 30 days of inactivity.
     *
     * @returns Promise<ProviderBackup>
     */
    public async backupData(providerBackup: ProviderBackup, secret: string) {
        const storage = new StorageApi(this.config);

        return storage.backup<ProviderBackup>(providerBackup, secret);
    }

    /**
     * Restores relevant data of the provider from the storage backend.
     * Used for persistance.
     *
     * @returns Promise<UserBackup>
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
        return encodeBase32(base64ToBuffer(randomBytes(15)));
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

    /**
     * decrypt and verify appointments
     *
     * @returns ProviderAppointment[]
     */
    protected async processApiAppointments(
        apiProviderProviderAppointments: ApiProviderProviderAppointments,
        providerKeyPairs: ProviderKeyPairs
    ) {
        await verify(
            [apiProviderProviderAppointments.provider.publicKey],
            apiProviderProviderAppointments.provider
        );

        const provider = parseUntrustedJSON<Provider>(
            apiProviderProviderAppointments.provider.data
        );

        const appointments = await Promise.all(
            apiProviderProviderAppointments.appointments.map(
                async (signedAppointment) => {
                    await this.verifyProviderAppointment(
                        signedAppointment,
                        providerKeyPairs
                    );

                    const apiAppointment = parseUntrustedJSON<ApiAppointment>(
                        signedAppointment.data
                    );

                    const apiBookings = await this.decryptBookings(
                        signedAppointment.bookings || [],
                        providerKeyPairs
                    );

                    const enrichedAppointment = enrichAppointment(
                        apiAppointment,
                        provider
                    );

                    const bookings: ProviderBooking[] = apiBookings.map(
                        (apiBooking) => ({
                            slotId: apiBooking.id,
                            appointment: enrichedAppointment,
                            token: apiBooking.userToken,
                            signedToken: apiBooking.signedToken,
                        })
                    );

                    let status = AppointmentStatus.UNKNOWN;

                    const slotCount = apiAppointment.slotData.length;
                    const bookedCount = bookings.length;

                    // no booked slots yet
                    if (bookedCount === 0) {
                        // and slots available
                        if (slotCount > 0) {
                            status = AppointmentStatus.OPEN;
                            // and no slots available
                        } else if (slotCount === 0) {
                            status = AppointmentStatus.CANCELED;
                        }
                        // booked slots already
                    } else if (bookedCount > 0) {
                        // all slots booked
                        if (slotCount === bookedCount) {
                            status = AppointmentStatus.FULL;
                            // open slots available
                        } else if (slotCount > bookedCount) {
                            status = AppointmentStatus.BOOKINGS;
                        }
                    }

                    if (status === AppointmentStatus.UNKNOWN) {
                        // if we didn't found a valid state, something is off.
                        throw new UnexpectedError(
                            `Unknown booking-state of appointment "${apiAppointment.id}"`
                        );
                    }

                    const appointment: Appointment = {
                        ...enrichedAppointment,
                        updatedAt: dayjs(signedAppointment.updatedAt)
                            .utc()
                            .toDate(),
                        status,
                        bookings,
                    };

                    return appointment;
                }
            )
        );

        // needed as promise.all() does not guarantee order
        appointments.sort((a, b) => (a.startDate > b.startDate ? 1 : -1));

        return appointments;
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

    protected async verifyProviderAppointment(
        signedAppointment: ApiSignedProviderAppointment,
        providerKeyPairs: ProviderKeyPairs
    ) {
        await verify([providerKeyPairs.signing.publicKey], signedAppointment);

        return true;
    }
}
