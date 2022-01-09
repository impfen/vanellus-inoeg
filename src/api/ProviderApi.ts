import { VanellusError } from "../errors";
import { dayjs, parseUntrustedJSON } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    ApiEncryptedBooking,
    Appointment,
    Booking,
    BookingData,
    ECDHData,
    EncryptedBackup,
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
    buf2base32,
    ecdhDecrypt,
    ecdhEncrypt,
    generateECDHKeyPair,
    generateECDSAKeyPair,
    generateSymmetricKey,
    randomBytes,
    sign,
    verify,
} from "./utils";
import { createAppointment } from "./utils/appointment";

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
     * Retrieves the appointments that belong to the provider from the backend
     *
     * @return Promise<Appointment[]>
     */
    public async getProviderAppointments(
        from: Date,
        to: Date,
        providerKeyPairs: ProviderKeyPairs
    ) {
        const signedAppointments = await this.transport.call(
            "getProviderAppointments",
            { from: dayjs(from).toISOString(), to: dayjs(to).toISOString() },
            providerKeyPairs.signing
        );

        const appointments: ProviderAppointment[] = [];

        for (const signedAppointment of signedAppointments) {
            const isVerified = await verify(
                [providerKeyPairs.signing.publicKey],
                signedAppointment
            );

            if (!isVerified) {
                throw new VanellusError(
                    "Could not verify provider-appointment"
                );
            }

            const appointmentData = parseUntrustedJSON<Appointment>(
                signedAppointment.data
            );

            const appointment: ProviderAppointment = {
                ...appointmentData,
                startDate: new Date(appointmentData.startDate),
                endDate: new Date(
                    new Date(appointmentData.startDate).getTime() +
                        1000 * 60 * Math.max(0, appointmentData.duration)
                ),
                slotData: appointmentData.slotData.map((slot) => {
                    slot.open = !signedAppointment.bookedSlots?.some(
                        (aslot) => aslot.id === slot.id
                    );

                    return slot;
                }),

                bookings: await this.decryptBookings(
                    signedAppointment.bookings || [],
                    providerKeyPairs
                ),
            };

            appointments.push(appointment);
        }

        return appointments;
    }

    /**
     * Publish appointments to the backend
     *
     * @return Promise<Appointment[]>
     */
    public async publishAppointments(
        unpublishedAppointments: Appointment[],
        providerKeyPairs: ProviderKeyPairs
    ) {
        const signedAppointments: SignedData[] = [];
        const appointments: Appointment[] = [];

        for (const unpublishedAppointment of unpublishedAppointments) {
            /**
             * we sign each appointment individually so that the client can verify that they've been posted by a valid provider
             */
            const signedAppointment = await sign(
                JSON.stringify({
                    timestamp: unpublishedAppointment.startDate.toISOString(),
                    ...unpublishedAppointment,
                }),
                providerKeyPairs.signing.privateKey,
                providerKeyPairs.signing.publicKey
            );

            appointments.push({
                id: unpublishedAppointment.id,
                duration: unpublishedAppointment.duration,
                publicKey: providerKeyPairs.encryption.publicKey,
                properties: unpublishedAppointment.properties,
                slotData: unpublishedAppointment.slotData.map((slot) => ({
                    id: slot.id,
                })),
                provider: unpublishedAppointment.provider,
                startDate: dayjs(unpublishedAppointment.startDate).toDate(),
                endDate: dayjs(unpublishedAppointment.startDate)
                    .utc()
                    .add(unpublishedAppointment.duration, "minutes")
                    .toDate(),
            });

            signedAppointments.push(signedAppointment);
        }

        await this.transport.call(
            "publishAppointments",
            {
                appointments: signedAppointments,
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
     *
     *
     * @returns Promise<Provider>
     */
    public async storeProvider(
        providerInput: ProviderInput,
        providerKeyPairs: ProviderKeyPairs,
        code?: string
    ) {
        const keys = await this.transport.call("getKeys");

        const providerDataWithoutId = Object.assign(
            {},
            {
                ...providerInput,
            },
            {
                publicKeys: {
                    data: providerKeyPairs.data.publicKey,
                    signing: providerKeyPairs.signing.publicKey,
                    encryption: providerKeyPairs.encryption.publicKey,
                },
            }
        );

        const encryptedData = await ecdhEncrypt(
            JSON.stringify(providerDataWithoutId),
            providerKeyPairs.data,
            keys.providerData
        );

        const { id } = await this.transport.call(
            "storeProviderData",
            {
                encryptedData: encryptedData,
                code: code,
            },
            providerKeyPairs.signing
        );

        const provider: Provider = {
            ...providerDataWithoutId,
            id,
        };

        return provider;
    }

    /**
     * Checks if a provider is confirmed and, if yes, returns the confirmed data.
     * If the current provider, who provided the keys, is not confirmed yet, null is returned.
     *
     * @todo check signature of retrieved ProviderData
     *
     * @return Promise<Provider | null>
     */
    public async getVerifiedProvider(providerKeyPairs: ProviderKeyPairs) {
        try {
            const encryptedConfirmedProviderECDAData =
                await this.transport.call(
                    "checkProviderData",
                    undefined,
                    providerKeyPairs.signing
                );

            const encryptedConfirmedProvider = parseUntrustedJSON<ECDHData>(
                encryptedConfirmedProviderECDAData.data
            );

            // decrypt retrieved data, if any, with the providers private key
            const decryptedProviderDataString = await ecdhDecrypt(
                encryptedConfirmedProvider,
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
    ): Promise<EncryptedBackup | null> {
        // storage-api

        return Promise.resolve(null);
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
        const sync = await generateSymmetricKey();
        const data = await generateECDHKeyPair();
        const signing = await generateECDSAKeyPair();
        const encryption = await generateECDHKeyPair();

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
        return buf2base32(b642buf(randomBytes(15)));
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

                const booking: Booking = {
                    ...restBooking,
                    ...decryptedBooking,
                };

                return booking;
            })
        );
    }
}
