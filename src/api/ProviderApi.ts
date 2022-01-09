import { Provider, ProviderInput, PublicProvider } from "../interfaces";
import { dayjs, parseUntrustedJSON } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    Appointment,
    Booking,
    BookingData,
    ECDHData,
    ProviderKeyPairs,
    SignedData,
    SignedProvider,
    Slot,
} from "./interfaces";
import { ProviderApiInterface } from "./ProviderApiInterface";
import {
    b642buf,
    buf2base32,
    generateECDHKeyPair,
    generateECDSAKeyPair,
    generateSymmetricKey,
    randomBytes,
    sign,
    verify,
} from "./utils";
import { ecdhDecrypt, ecdhEncrypt } from "./utils/encrypt";

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
     * @param timestamp time of the appointment
     *
     * @return Appointment
     */
    public createAppointment(
        duration: number,
        vaccine: string,
        slotCount: number,
        timestamp: Date,
        provider: PublicProvider,
        providerKeyPairs: ProviderKeyPairs
    ) {
        const slotData: Slot[] = [];

        for (let i = 0; i < slotCount; i++) {
            slotData[i] = {
                id: randomBytes(32),
                open: true,
            };
        }

        const now = dayjs().utc().toISOString();

        const appointment: Appointment = {
            id: randomBytes(32),
            bookings: [],
            updatedAt: now,
            modified: true,
            timestamp: dayjs(timestamp).utc().toISOString(),
            duration: duration,
            properties: { vaccine: vaccine },
            slotData,
            publicKey: providerKeyPairs.encryption.publicKey,
            provider,
        };

        return appointment;
    }

    /**
     * Retrieves the appointments that belong to the provider from the backend
     *
     * @return Promise<Appointment[]>
     */
    public async getAppointments(
        from: Date,
        to: Date,
        providerKeyPairs: ProviderKeyPairs
    ) {
        const signedAppointments = await this.transport.call(
            "getProviderAppointments",
            { from: dayjs(from).toISOString(), to: dayjs(to).toISOString() },
            providerKeyPairs.signing
        );

        const newAppointments: Appointment[] = [];

        for (const signedAppointment of signedAppointments) {
            const isVerified = await verify(
                [providerKeyPairs.signing.publicKey],
                signedAppointment
            );

            if (!isVerified) {
                continue;
            }

            const appointment = parseUntrustedJSON<Appointment>(
                signedAppointment.data
            );

            // ???
            // // this appointment was loaded already (should not happen)
            // if (
            //     !appointment ||
            //     newAppointments.find(
            //         (appointment) => appointment.id === appointment.id
            //     )
            // ) {
            //     continue;
            // }

            const newAppointment: Appointment = {
                ...appointment,
                bookings: await this.decryptBookings(
                    signedAppointment.bookings || [],
                    providerKeyPairs
                ),
                modified: false,
            };

            newAppointments.push(newAppointment);
        }

        return newAppointments;
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

        // needed ?
        // to be relevant, an appointment:
        // const relevantAppointments = unpublishedAppointments.filter(
        //     (oa) =>
        //         // begins at least 4 hours in the future
        //         dayjs(oa.timestamp).isAfter(dayjs().add(4, "hours"))
        //     // &&
        //     // and needs to be modified/new
        //     oa.modified
        // );

        for (const unpublishedAppointment of unpublishedAppointments) {
            // const appointmentToPublish: UnpublishedAppointment = {
            //     id: unpublishedAppointment.id,
            //     duration: unpublishedAppointment.duration,
            //     timestamp: unpublishedAppointment.timestamp,
            //     publicKey: providerKeyPairs.encryption.publicKey,
            //     properties: unpublishedAppointment.properties,
            //     slotData: unpublishedAppointment.slotData.map((slot) => ({
            //         id: slot.id,
            //     })),
            // };

            /**
             * we sign each appointment individually so that the client can verify that they've been posted by a valid provider
             */
            const signedAppointment = await sign(
                JSON.stringify(unpublishedAppointment), // appointmentToPublish
                providerKeyPairs.signing.privateKey,
                providerKeyPairs.signing.publicKey
            );

            appointments.push({
                ...unpublishedAppointment,
            }); // appointmentToPublish

            signedAppointments.push(signedAppointment);
        }

        // if (signedAppointments.length === 0) {
        //     return [];
        // }

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
     *
     * If the provider is not confirmed yet, null is returned.
     *
     * This method returns the provider without its public keys. Maybe subject to change.
     *
     * @todo check signature of retrieved ProviderData
     *
     * @return Promise<Provider | null>
     */
    public async checkData(providerKeyPairs: ProviderKeyPairs) {
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

    // Unused?
    // public createSlot() {
    //     return {
    //         open: true,
    //         id: randomBytes(32), // where the user can submit his confirmation
    //         status: randomBytes(32), // where the user can get the appointment status
    //         cancel: randomBytes(32), // where the user can cancel his confirmation
    //     };
    // }

    /**
     * Decrypt a booking
     *
     * @returns Promise<Booking[]>
     */
    protected async decryptBookings(
        bookings: Booking[],
        providerKeyPairs: ProviderKeyPairs
    ) {
        return Promise.all(
            bookings.map(async (booking) => {
                try {
                    const decryptedData = await ecdhDecrypt(
                        booking.encryptedData,
                        providerKeyPairs.encryption.privateKey
                    );

                    booking.data =
                        parseUntrustedJSON<BookingData>(decryptedData);
                } catch (error) {
                    console.error(error);
                }

                return booking;
            })
        );

        // for (const booking of bookings) {
        //     const decryptedData = await ecdhDecrypt(
        //         booking.encryptedData,
        //         privKey
        //     );

        //     try {
        //         booking.data = parseUntrustedJSON<BookingData>(decryptedData);
        //     } catch (error) {
        //         continue;
        //     }
        // }

        // return bookings;
    }
}
