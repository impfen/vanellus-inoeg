import {
    Appointment,
    Booking,
    ECDHData,
    KeyPairs,
    ProviderData,
    ProviderKeyPairs,
    SignedData,
    Slot,
    Status,
} from ".."
import { sign, verify } from "../crypto"
import { ErrorCode, VanellusError } from "../errors"
import { ProviderBackendService } from "./backend/ProviderBackendService"
import { Transport } from "./transports/Transport"
import { ecdhDecrypt, ecdhEncrypt } from "./utils/crypto/encrypt"
import { parseUntrustedJSON } from "./utils/parseUntrustedJSON"

export class ProviderService {
    constructor(
        protected readonly transport: Transport<ProviderBackendService>
    ) {}

    /**
     * Retrieves the appointments that belong to the provider from the backend
     *
     * @param from earliest timestamp for the returned appointments as an ISO
     * @param to time latest timestamp for the returned appointments as an ISO
     */
    public async getAppointments(from: string, to: string, keyPairs: KeyPairs) {
        const appointments = await this.transport.call(
            "getAppointments",
            { from: from, to: to },
            keyPairs.signing
        )

        const newAppointments: Appointment[] = []

        for (const appointment of appointments) {
            const verified = await verify(
                [keyPairs.signing.publicKey],
                appointment
            )

            if (!verified) {
                continue
            }

            const appointmentData = parseUntrustedJSON<Appointment>(
                appointment.data
            )

            // this appointment was loaded already (should not happen)
            if (
                !appointmentData ||
                newAppointments.find(
                    (appointment) => appointment.id === appointmentData.id
                )
            ) {
                continue
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
                    keyPairs.encryption.privateKey
                ),
                modified: false,
                id: appointmentData.id,
            }

            newAppointments.push(newAppointment)
        }

        return newAppointments
    }

    // publish all local appointments to the backend
    public async publishAppointments(
        unpublishedAppointments: Appointment[],
        keyPairs: ProviderKeyPairs
    ) {
        const signedAppointments: SignedData[] = []

        const relevantAppointments = unpublishedAppointments.filter(
            (oa) =>
                new Date(oa.timestamp) >
                    new Date(new Date().getTime() - 1000 * 60 * 60 * 4) &&
                oa.modified
        )

        for (const appointment of relevantAppointments) {
            const convertedAppointment = {
                id: appointment.id,
                duration: appointment.duration,
                timestamp: appointment.timestamp,
                publicKey: keyPairs.encryption.publicKey,
                properties: appointment.properties,
                slotData: appointment.slotData.map((sl: Slot) => ({
                    id: sl.id,
                })),
            }

            // we sign each appointment individually so that the client can
            // verify that they've been posted by a valid provider
            const signedAppointment = await sign(
                keyPairs.signing.privateKey,
                JSON.stringify(convertedAppointment),
                keyPairs.signing.publicKey
            )

            signedAppointments.push(signedAppointment)
        }

        if (signedAppointments.length === 0)
            return {
                status: Status.Succeeded,
            }

        return this.transport.call(
            "publishAppointments",
            {
                signedAppointments,
            },
            keyPairs.signing
        )
    }

    public async storeProviderData(
        data: ProviderData,
        keyPairs: ProviderKeyPairs,
        code?: string
    ) {
        const keys = await this.transport.call("getKeys", undefined)

        if (!data) return new VanellusError(ErrorCode.DataMissing)

        const dataToEncrypt = Object.assign({}, data)

        dataToEncrypt.publicKeys = {
            signing: keyPairs.signing.publicKey,
            encryption: keyPairs.encryption.publicKey,
        }

        const encryptedData = await ecdhEncrypt(
            JSON.stringify(dataToEncrypt),
            keyPairs.data,
            keys.providerData
        )

        return this.transport.call(
            "storeProviderData",
            {
                encryptedData: encryptedData,
                code: code,
            },
            keyPairs.signing
        )

        // in the original code, the data was updated after saving it to the backend
        // and written to localStorage?

        // data.submittedAt = new Date().toISOString()
        // data.version = "0.4"

        // this.data = data

        // return {
        //     status: Status.Succeeded,
        //     data: result,
        // }
    }

    public async checkProviderData(keyPairs: ProviderKeyPairs) {
        const response = await this.transport.call(
            "checkProviderData",
            undefined,
            keyPairs.signing
        )

        const json = parseUntrustedJSON<ECDHData>(response.data)

        if (!json)
            return new VanellusError(ErrorCode.DataMissing, "invalid json")

        // to do: check signature
        const decryptedJSONData = await ecdhDecrypt(
            json,
            keyPairs.data.privateKey
        )

        return parseUntrustedJSON<ProviderData>(decryptedJSONData)
    }

    protected async decryptBookings(bookings: Booking[], privKey: JsonWebKey) {
        for (const booking of bookings) {
            const decryptedData = await ecdhDecrypt(
                booking.encryptedData,
                privKey
            )

            const dd = parseUntrustedJSON<any>(decryptedData)

            if (!dd) {
                continue
            }

            booking.data = dd
        }

        return bookings
    }
}
