import { VanellusError } from "../errors";
import { dayjs, parseUntrustedJSON } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    ApiProviderAppointments,
    ApiSignedAppointment,
    ApiSignedProviderAppointments,
    Appointment,
    PublicProviderData,
    Slot,
} from "./interfaces";

export class AnonymousApi extends AbstractApi<AnonymousApiInterface> {
    public async getAppointment(id: string, providerID: string) {
        const providerAppointments = await this.transport.call(
            "getAppointment",
            {
                id,
                providerID,
            }
        );

        const jsonProvider = this.verifyProviderData(providerAppointments);

        if (!jsonProvider) {
            throw new VanellusError("invalid provider");
        }

        providerAppointments.provider.json = jsonProvider;

        // we copy the ID for convenience
        providerAppointments.provider.json.id =
            providerAppointments.provider.id;

        const signedAppointment = providerAppointments.appointments[0];

        const appointment = this.verifyAppointment(
            signedAppointment
            // providerAppointments
        );

        if (!appointment) {
            throw new VanellusError("invalid appointment");
        }

        for (const slot of appointment.slotData) {
            if (
                signedAppointment.bookedSlots?.some(
                    (bookedSlot) => bookedSlot.id === slot.id
                )
            ) {
                slot.open = false;
            } else {
                slot.open = true;
            }
        }

        return {
            provider: providerAppointments.provider.json,
            appointment: appointment,
        };
    }

    public async getAppointmentsByZipCode(
        zipCode: string,
        radius: number,
        from: Date,
        to: Date
    ) {
        const unverifiedProviderAppointments = await this.transport.call(
            "getAppointmentsByZipCode",
            {
                zipCode,
                radius,
                from: dayjs(from).toISOString(),
                to: dayjs(to).toISOString(),
            }
        );

        const providerAppointments: ApiProviderAppointments[] = [];

        for (const providerAppointment of unverifiedProviderAppointments) {
            const jsonProvider = this.verifyProviderData(providerAppointment);

            if (!jsonProvider) {
                throw new VanellusError("invalid provider");
            }

            providerAppointment.provider.json = jsonProvider;

            // we copy the ID for convenience
            providerAppointment.provider.json.id =
                providerAppointment.provider.id;

            const appointments: Appointment[] = [];

            for (const signedAppointment of providerAppointment.appointments) {
                const appointment = this.verifyAppointment(
                    signedAppointment
                    // providerAppointment
                );

                if (!appointment) {
                    continue;
                }

                for (const slot of appointment.slotData) {
                    if (
                        !signedAppointment.bookedSlots?.some(
                            (aslot: Slot) => aslot.id === slot.id
                        )
                    ) {
                        slot.open = true;
                    }
                }

                appointments.push(appointment);
            }

            providerAppointments.push({
                provider: providerAppointment.provider.json,
                appointments: appointments,
            });
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

    /**
     * @todo: verify based on key chain
     */
    protected verifyAppointment(
        signedAppointment: ApiSignedAppointment
        // providerAppointments: ProviderAppointments
    ) {
        // let found = false;

        // for (const providerKeys of keys.lists.providers) {
        //     if (providerKeys.json.signing === signedAppointment.publicKey) {
        //         found = true;
        //         break;
        //     }
        // }
        // if (!found) {
        //     throw new Error("invalid key");
        // }

        // const result = await verify(
        //     [signedAppointment.publicKey],
        //     signedAppointment
        // );

        // if (!result) {
        //     throw new Error("invalid signature");
        // }

        return parseUntrustedJSON<Appointment>(signedAppointment.data);
    }

    /**
     * @todo verify based on key chain
     */
    protected verifyProviderData(
        providerAppointments: ApiSignedProviderAppointments
    ) {
        /*
        let found = false;
        if (item.keyChain.mediator.signin)
        for (const mediatorKeys of keys.lists.mediators) {
            if (mediatorKeys.json.signing === providerData.publicKey) {
                found = true;
                break;
            }
        }
        if (!found) throw 'invalid key';
        const result = await verify([item.provider.publicKey], providerData);
        if (!result) throw 'invalid signature';
        */

        return parseUntrustedJSON<PublicProviderData>(
            providerAppointments.provider.data
        );
    }
}
