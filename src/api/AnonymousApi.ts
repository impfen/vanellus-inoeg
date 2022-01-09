import { dayjs, parseUntrustedJSON } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    ApiSignedProviderAppointments,
    Appointment,
    ProviderAppointments,
    PublicProviderData,
    Slot,
} from "./interfaces";

export class AnonymousApi extends AbstractApi<AnonymousApiInterface> {
    /**
     * @todo: verify based on key chain
     */
    public async getAppointment(id: string, providerID: string) {
        return this.decryptProviderAppointment(
            await this.transport.call("getAppointment", {
                id,
                providerID,
            })
        );
    }

    /**
     * @todo: verify based on key chain
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

        const providerAppointments: ProviderAppointments[] = [];

        for (const signedProviderAppointment of signedProviderAppointments) {
            providerAppointments.push(
                this.decryptProviderAppointment(signedProviderAppointment)
            );
        }

        providerAppointments.sort((a, b) =>
            a.provider.name > b.provider.name ? 1 : -1
        );

        return providerAppointments;
    }

    public async getProvidersByZipCode(zipFrom: string, zipTo: string) {
        const signedProviders = await this.transport.call(
            "getProvidersByZipCode",
            {
                zipFrom,
                zipTo,
            }
        );

        const providers: PublicProviderData[] = [];

        for (const signedProvider of signedProviders) {
            const publicProviderData = parseUntrustedJSON<PublicProviderData>(
                signedProvider.data
            );

            if (!publicProviderData) {
                continue;
            }

            publicProviderData.id = signedProvider.id;
            providers.push(publicProviderData);
        }

        return providers;
    }

    public async getKeys() {
        return this.transport.call("getKeys");
    }

    public async getConfigurables() {
        return this.transport.call("getConfigurables");
    }

    protected decryptProviderAppointment(
        signedProviderAppointments: ApiSignedProviderAppointments
    ) {
        const publicProviderData = parseUntrustedJSON<PublicProviderData>(
            signedProviderAppointments.provider.data
        );

        signedProviderAppointments.provider.json = publicProviderData;

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

            appointments.push(appointment);
        }

        // we copy the ID for convenience
        signedProviderAppointments.provider.json.id =
            signedProviderAppointments.provider.id;

        const providerAppointments: ProviderAppointments = {
            provider: signedProviderAppointments.provider.json,
            appointments: appointments,
        };

        return providerAppointments;
    }
}
