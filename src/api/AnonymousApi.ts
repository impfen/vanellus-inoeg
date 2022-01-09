import { PublicProvider } from "../interfaces";
import { dayjs, parseUntrustedJSON } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import { ApiSignedAppointments, Appointment, Slot } from "./interfaces";

export class AnonymousApi extends AbstractApi<AnonymousApiInterface> {
    /**
     * Returns a single Appointment
     *
     * @todo: verify based on key chain
     *
     * @return Promise<Appointments>
     */
    public async getAppointment(id: string, providerID: string) {
        return (
            this.decryptAppointments(
                await this.transport.call("getAppointment", {
                    id,
                    providerID,
                })
            )[0] || null
        );
    }

    /**
     * @todo: verify based on key chain
     *
     * @return Promise<Appointments[]>
     */
    public async getAppointmentsByZipCode(
        zipCode: string,
        radius: number,
        from: Date,
        to: Date
    ) {
        const signedProviderAppointments = await this.transport.call(
            "getAppointmentsByZipCode",
            {
                zipCode,
                radius,
                from: dayjs(from).toISOString(),
                to: dayjs(to).toISOString(),
            }
        );

        let appointments: Appointment[] = [];

        for (const signedProviderAppointment of signedProviderAppointments) {
            appointments = appointments.concat(
                this.decryptAppointments(signedProviderAppointment)
            );
        }

        // why ???
        // appointments.sort((a, b) =>
        //     a.provider.name > b.provider.name ? 1 : -1
        // );

        return appointments;
    }

    /**
     * Returns a list of public provider-data, filtered by a range of zips
     *
     * @returns Promise<PublicProvider[]>
     */
    public async getProvidersByZipCode(zipFrom: string, zipTo: string) {
        const signedProviders = await this.transport.call(
            "getProvidersByZipCode",
            {
                zipFrom,
                zipTo,
            }
        );

        const providers: PublicProvider[] = [];

        for (const signedProvider of signedProviders) {
            const publicProvider = parseUntrustedJSON<PublicProvider>(
                signedProvider.data
            );

            if (!publicProvider) {
                continue;
            }

            publicProvider.id = signedProvider.id;
            providers.push(publicProvider);
        }

        return providers;
    }

    /**
     * Returns the public keys in the system
     *
     * @returns Promise<BackendPublicKeys>
     */
    public async getKeys() {
        return this.transport.call("getKeys");
    }

    /**
     * Returns the basic configurable settings which are relevant for the ui.
     *
     * Espacially requestable timeframes and vaccines.
     *
     * @returns Promise<Configurables>
     */
    public async getConfigurables() {
        return this.transport.call("getConfigurables");
    }

    /**
     * Decrypts an appointment
     *
     * @returns Appointment[]
     */
    protected decryptAppointments(
        signedProviderAppointments: ApiSignedAppointments
    ) {
        const publicProvider = parseUntrustedJSON<PublicProvider>(
            signedProviderAppointments.provider.data
        );

        const appointments: Appointment[] = [];

        for (const signedAppointment of signedProviderAppointments.appointments) {
            const appointment = parseUntrustedJSON<Appointment>(
                signedAppointment.data
            );

            if (!appointment) {
                continue;
            }

            for (const slot of appointment.slotData) {
                if (
                    signedAppointment.bookedSlots?.some(
                        (aslot: Slot) => aslot.id === slot.id
                    )
                ) {
                    slot.open = false;
                } else {
                    slot.open = true;
                }
            }

            appointment.provider = publicProvider;

            appointments.push(appointment);
        }

        return appointments;
    }
}
