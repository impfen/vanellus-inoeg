import { dayjs, parseUntrustedJSON } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import { ApiError } from "./errors";
import {
    AggregatedAppointment,
    ApiAppointment,
    ApiProviderAppointments,
    PublicAppointment,
    PublicProvider,
} from "./interfaces";
import { enrichAppointment, verify } from "./utils";

export class AnonymousApi extends AbstractApi<AnonymousApiInterface> {
    /**
     * Returns a single, public Appointment
     *
     * @todo: verify based on key chain
     *
     * @return Promise<PublicAppointment | null>
     */
    public async getAppointment(
        appointmentId: string,
        providerId: string,
        doVerify = false
    ) {
        const signedAppointments = await this.transport.call("getAppointment", {
            id: appointmentId,
            providerID: providerId,
        });

        return (
            (await this.parseAppointments(signedAppointments, doVerify))[0] ||
            null
        );
    }

    /**
     * @todo: verify based on key chain?
     *
     * @return Promise<PublicAppointment[]>
     */
    public async getAppointments(
        zipCode: number | string,
        from: Date,
        to: Date,
        radius = 50,
        doVerify = false
    ) {
        const signedProviderAppointments = await this.transport.call(
            "getAppointmentsByZipCode",
            {
                zipCode: zipCode.toString(),
                from: dayjs(from).toISOString(),
                to: dayjs(to).toISOString(),
                radius,
            }
        );

        let appointments: PublicAppointment[] = [];

        for (const signedProviderAppointment of signedProviderAppointments) {
            appointments = appointments.concat(
                await this.parseAppointments(
                    signedProviderAppointment,
                    doVerify
                )
            );
        }

        return appointments;
    }

    /**
     * @return Promise<AggregatedAppointment[]>
     */
    public async getAggregatedAppointments(
        zipCode: number | string,
        from: Date,
        to: Date,
        radius = 50
    ) {
        const ApiAggregatedAppointments = await this.transport.call(
            "getAppointmentsAggregated",
            {
                zipCode: zipCode.toString(),
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
    public async getProviders(
        zipFrom: number | string,
        zipTo: number | string
    ) {
        const signedProviders = await this.transport.call(
            "getProvidersByZipCode",
            {
                zipFrom: zipFrom.toString(),
                zipTo: zipTo.toString(),
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
     * @returns PublicAppointment[]
     */
    protected async parseAppointments(
        signedAppointments: ApiProviderAppointments,
        doVerify = false
    ) {
        const publicProvider = parseUntrustedJSON<PublicProvider>(
            signedAppointments.provider.data
        );

        const appointments: PublicAppointment[] = [];

        for (const signedAppointment of signedAppointments.appointments) {
            const apiAppointment = parseUntrustedJSON<ApiAppointment>(
                signedAppointment.data
            );

            if (doVerify) {
                const isVerified = await verify(
                    [signedAppointment.publicKey],
                    signedAppointment
                );

                if (!isVerified) {
                    throw new ApiError(
                        `Validation of appointment ${apiAppointment.id} failed`
                    );
                }
            }

            appointments.push(
                enrichAppointment(
                    {
                        ...apiAppointment,
                        bookedSlots: signedAppointment.bookedSlots,
                    },
                    publicProvider
                )
            );
        }

        return appointments;
    }
}
