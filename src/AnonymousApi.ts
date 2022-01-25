// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { NotFoundError, TransportError } from ".";
import { AbstractApi } from "./AbstractApi";
import type {
    AggregatedPublicAppointment,
    ApiAppointment,
    ApiProviderAppointments,
    PublicAppointment,
    PublicProvider,
} from "./interfaces";
import type { AnonymousApiInterface } from "./interfaces/endpoints/AnonymousApiInterface";
import { enrichAppointment, parseUntrustedJSON, verify } from "./utils";

export class AnonymousApi<
    Vaccine = string
> extends AbstractApi<AnonymousApiInterface> {
    /**
     * Returns a single, public Appointment
     *
     * @return Promise<PublicAppointment | null>
     */
    public async getAppointment(
        appointmentId: string,
        providerId: string,
        doVerify = false
    ) {
        try {
            const signedAppointments = await this.transport.call(
                "getAppointment",
                {
                    id: appointmentId,
                    providerID: providerId,
                }
            );

            return (
                await this.parseAppointments(signedAppointments, doVerify)
            )[0];
        } catch (error) {
            if (error instanceof TransportError && error.code === -32602) {
                throw new NotFoundError(
                    `Couldn't find appointment with id ${appointmentId}`
                );
            }

            throw error;
        }
    }

    /**
     * @return Promise<PublicAppointment[]>
     */
    public async getAppointments(
        zipCode: number | string,
        from: Dayjs,
        to: Dayjs,
        radius = 50,
        doVerify = false
    ) {
        const signedProviderAppointments = await this.transport.call(
            "getAppointmentsByZipCode",
            {
                zipCode: zipCode.toString(),
                from: from.utc().toISOString(),
                to: to.utc().toISOString(),
                radius,
            }
        );

        let appointments: PublicAppointment<Vaccine>[] = [];

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
     * @return Promise<AggregatedPublicAppointment[]>
     */
    public async getAggregatedAppointments(
        date: Dayjs,
        zipFrom: number | string,
        zipTo?: number | string
    ) {
        const ApiAggregatedAppointments = await this.transport.call(
            "getAppointmentsAggregated",
            {
                zipFrom: zipFrom.toString(),
                zipTo: zipTo ? zipTo.toString() : zipFrom.toString(),
                date: date.utc().format("YYYY-MM-DD"),
            }
        );

        const aggregatedAppointments: AggregatedPublicAppointment<Vaccine>[] =
            [];

        for (const apiAggregatedAppointment of ApiAggregatedAppointments) {
            for (const aggregatedAppointment of apiAggregatedAppointment.appointments) {
                aggregatedAppointments.push({
                    ...aggregatedAppointment,
                    vaccine:
                        aggregatedAppointment.vaccine as unknown as Vaccine,
                    provider: apiAggregatedAppointment.provider,
                    startDate: dayjs.utc(aggregatedAppointment.timestamp),
                    endDate: dayjs
                        .utc(aggregatedAppointment.timestamp)
                        .add(aggregatedAppointment.duration, "minutes"),
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
        zipTo?: number | string
    ) {
        const signedProviders = await this.transport.call(
            "getProvidersByZipCode",
            {
                zipFrom: zipFrom.toString(),
                zipTo: zipTo ? zipTo.toString() : zipFrom.toString(),
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

        const appointments: PublicAppointment<Vaccine>[] = [];

        for (const signedAppointment of signedAppointments.appointments) {
            const apiAppointment = parseUntrustedJSON<ApiAppointment>(
                signedAppointment.data
            );

            if (doVerify) {
                await verify([signedAppointment.publicKey], signedAppointment);
            }

            appointments.push(
                enrichAppointment<Vaccine>(
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
