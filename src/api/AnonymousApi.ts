import { dayjs, parseUntrustedJSON } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    AggregatedAppointment,
    ApiAppointment,
    ApiProviderAppointments,
    Appointment,
    PublicProvider,
} from "./interfaces";
import { enrichAppointment } from "./utils/appointment";

export class AnonymousApi extends AbstractApi<AnonymousApiInterface> {
    /**
     * Returns a single Appointment
     *
     * @todo: verify based on key chain
     *
     * @return Promise<Appointment | null>
     */
    public async getAppointment(appointmentId: string, providerId: string) {
        const signedAppointments = await this.transport.call("getAppointment", {
            id: appointmentId,
            providerID: providerId,
        });

        return this.parseAppointments(signedAppointments)[0] || null;
    }

    /**
     * @todo: verify based on key chain?
     *
     * @return Promise<Appointment[]>
     */
    public async getAppointments(
        zipCode: string,
        from: Date,
        to: Date,
        radius = 50
    ) {
        const signedProviderAppointments = await this.transport.call(
            "getAppointmentsByZipCode",
            {
                zipCode,
                from: dayjs(from).toISOString(),
                to: dayjs(to).toISOString(),
                radius,
            }
        );

        let appointments: Appointment[] = [];

        for (const signedProviderAppointment of signedProviderAppointments) {
            appointments = appointments.concat(
                this.parseAppointments(signedProviderAppointment)
            );
        }

        return appointments;
    }

    /**
     * @return Promise<AggregatedAppointment[]>
     */
    public async getAggregatedAppointments(
        zipCode: string,
        from: Date,
        to: Date,
        radius = 50
    ) {
        const ApiAggregatedAppointments = await this.transport.call(
            "getAppointmentsAggregated",
            {
                zipCode,
                from: dayjs(from).toISOString(),
                to: dayjs(to).toISOString(),
                radius,
            }
        );

        const aggregatedAppointments: AggregatedAppointment[] = [];

        for (const apiAggregatedAppointment of ApiAggregatedAppointments) {
            for (const aggregatedAppointment of apiAggregatedAppointment.appointments) {
                aggregatedAppointments.push({
                    ...aggregatedAppointment,
                    provider: apiAggregatedAppointment.provider,
                    startDate: dayjs(aggregatedAppointment.timestamp)
                        .utc()
                        .toDate(),
                    endDate: dayjs(aggregatedAppointment.timestamp)
                        .utc()
                        .add(aggregatedAppointment.duration, "minutes")
                        .toDate(),
                });
            }
        }

        return aggregatedAppointments;
    }

    /**
     * Returns a list of public provider-data, filtered by a range of zips
     *
     * @returns Promise<PublicProvider[]>
     */
    public async getProviders(zipFrom: string, zipTo: string) {
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
     * Espacially requestable timeframes and vaccines.
     *
     * @returns Promise<Configurables>
     */
    public async getConfigurables() {
        return this.transport.call("getConfigurables");
    }

    /**
     * Parses an appointment
     *
     * @returns Appointment[]
     */
    protected parseAppointments(signedAppointments: ApiProviderAppointments) {
        const publicProvider = parseUntrustedJSON<PublicProvider>(
            signedAppointments.provider.data
        );

        const appointments: Appointment[] = [];

        for (const signedAppointment of signedAppointments.appointments) {
            const apiAppointment = parseUntrustedJSON<ApiAppointment>(
                signedAppointment.data
            );

            appointments.push(
                enrichAppointment(apiAppointment, publicProvider)
            );
        }

        return appointments;
    }
}
