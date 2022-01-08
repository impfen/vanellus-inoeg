import { dayjs, parseUntrustedJSON } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    Appointment,
    Booking,
    BookingData,
    ECDHData,
    ProviderData,
    ProviderInput,
    ProviderKeyPairs,
    ProviderSignedData,
    PublicProviderData,
    SignedData,
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
     * @param duration defines the length of the appointment in minutes
     * @param vaccine defines the vaccine offered at the appointment
     * @param slotN defines the number of people that can be vaccinated
     * @param timestamp defines the time of the appointment
     */
    public createAppointment(
        duration: number,
        vaccine: string,
        slotCount: number,
        timestamp: Date
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
            bookings: [],
            updatedAt: now,
            modified: true,
            timestamp: dayjs(timestamp).utc().toISOString(),
            duration: duration,
            properties: { vaccine: vaccine },
            id: randomBytes(32),
            publicKey: "",
            slotData: slotData,
        };

        return appointment;
    }

    /**
     * Retrieves the appointments that belong to the provider from the backend
     *
     * @param from earliest timestamp for the returned appointments as IsoString
     * @param to time latest timestamp for the returned appointments as IsoString
     */
    public async getAppointments(
        from: Date,
        to: Date,
        providerKeyPairs: ProviderKeyPairs
    ) {
        const appointments = await this.transport.call(
            "getProviderAppointments",
            { from: dayjs(from).toISOString(), to: dayjs(to).toISOString() },
            providerKeyPairs.signing
        );

        const newAppointments: Appointment[] = [];

        for (const appointment of appointments) {
            const verified = await verify(
                [providerKeyPairs.signing.publicKey],
                appointment
            );

            if (!verified) {
                continue;
            }

            const appointmentData = parseUntrustedJSON<Appointment>(
                appointment.data
            );

            // this appointment was loaded already (should not happen)
            if (
                !appointmentData ||
                newAppointments.find(
                    (appointment) => appointment.id === appointmentData.id
                )
            ) {
                continue;
            }

            const newAppointment: Appointment = {
                updatedAt: appointmentData.updatedAt,
                timestamp: appointmentData.timestamp,
                duration: appointmentData.duration,
                slotData: appointmentData.slotData,
                publicKey: appointmentData.publicKey,
                properties: appointmentData.properties,
                bookings: await this.decryptBookings(
                    appointment.bookings || [],
                    providerKeyPairs
                ),
                modified: false,
                id: appointmentData.id,
            };

            newAppointments.push(newAppointment);
        }

        return newAppointments;
    }

    /**
     * Publish appointments to the backend
     */
    public async publishAppointments(
        unpublishedAppointments: Appointment[],
        providerKeyPairs: ProviderKeyPairs
    ) {
        const signedAppointments: SignedData[] = [];

        // to be relevant, an appointment:
        const relevantAppointments = unpublishedAppointments.filter(
            (oa) =>
                // begin of appointment has to be at least 4 hours in the future
                dayjs(oa.timestamp).isAfter(dayjs().add(4, "hours")) &&
                // and be modified/new
                oa.modified
        );

        for (const appointment of relevantAppointments) {
            const convertedAppointment = {
                id: appointment.id,
                duration: appointment.duration,
                timestamp: appointment.timestamp,
                publicKey: providerKeyPairs.encryption.publicKey,
                properties: appointment.properties,
                slotData: appointment.slotData.map((slot) => ({
                    id: slot.id,
                })),
            };

            /**
             * we sign each appointment individually so that the client can verify that they've been posted by a valid provider
             */
            const signedAppointment = await sign(
                JSON.stringify(convertedAppointment),
                providerKeyPairs.signing.privateKey,
                providerKeyPairs.signing.publicKey
            );

            signedAppointments.push(signedAppointment);
        }

        if (signedAppointments.length === 0) {
            return null;
        }

        return this.transport.call(
            "publishAppointments",
            {
                appointments: signedAppointments,
            },
            providerKeyPairs.signing
        );
    }

    /**
     * Cancles an appointment by emptying the slots of the appointment and uploading
     * to server
     *
     * @param appointment The appointment to be cancled
     */
    public async cancelAppointment(
        appointment: Appointment,
        keyPairs: ProviderKeyPairs
    ) {
        appointment.slotData = [];

        return this.publishAppointments([appointment], keyPairs);
    }

    public async storeProvider(
        provider: ProviderInput,
        keyPairs: ProviderKeyPairs,
        code?: string
    ) {
        const keys = await this.transport.call("getKeys");

        const providerData: ProviderData = Object.assign({}, provider, {
            publicKeys: {
                signing: keyPairs.signing.publicKey,
                encryption: keyPairs.encryption.publicKey,
            },
        });

        const encryptedData = await ecdhEncrypt(
            JSON.stringify(providerData),
            keyPairs.data,
            keys.providerData
        );

        await this.transport.call(
            "storeProviderData",
            {
                encryptedData: encryptedData,
                code: code,
            },
            keyPairs.signing
        );

        return providerData;
    }

    /**
     * Checks if a provider is confirmed and, if yes, returns the confirmed data.
     * If the provider is not confirmed yet, null is returned
     *
     * @todo check signature of retrieved ProviderData
     */
    public async checkData(keyPairs: ProviderKeyPairs) {
        try {
            const response = await this.transport.call(
                "checkProviderData",
                undefined,
                keyPairs.signing
            );

            const ecdhData = parseUntrustedJSON<ECDHData>(response.data);

            // decrypt retrieved data, if any, with the providers private key
            const decryptedProviderDataString = await ecdhDecrypt(
                ecdhData,
                keyPairs.data.privateKey
            );

            const decryptedProviderDataJSON =
                parseUntrustedJSON<ProviderSignedData>(
                    decryptedProviderDataString
                );

            const providerData = parseUntrustedJSON<PublicProviderData>(
                decryptedProviderDataJSON.signedPublicData.data
            );

            return providerData;
        } catch (error) {
            console.error(error);

            return null;
        }
    }

    /**
     * Generates all needed key pairs for the provider
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

    public generateSecret() {
        return buf2base32(b642buf(randomBytes(15)));
    }

    public createSlot() {
        return {
            open: true,
            id: randomBytes(32), // where the user can submit his confirmation
            status: randomBytes(32), // where the user can get the appointment status
            cancel: randomBytes(32), // where the user can cancel his confirmation
        };
    }

    /**
     * De
     * @param bookings
     * @param privKey
     * @returns
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
