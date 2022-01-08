import {
    ApiSignedProviderAppointments,
    ApiSignedPublicProvider,
    Configurables,
    PublicKeys,
} from "./interfaces";
import { StorageApiInterface } from "./StorageApiInterface";

export interface AnonymousApiInterface extends StorageApiInterface {
    getAppointment: ({
        id,
        providerID,
    }: {
        id: string;
        providerID: string;
    }) => ApiSignedProviderAppointments;

    getAppointmentsByZipCode: ({
        zipCode,
        radius,
        from,
        to,
    }: {
        zipCode: string;
        radius: number;
        from: string;
        to: string;
    }) => ApiSignedProviderAppointments[];

    getProvidersByZipCode: ({
        zipFrom,
        zipTo,
    }: {
        zipFrom: string;
        zipTo: string;
    }) => ApiSignedPublicProvider[];

    // return all public keys present in the system
    getKeys: () => PublicKeys;

    getConfigurables: () => Configurables;

    // getStats: (
    //     type: string,
    //     id?: string,
    //     metric?: string,
    //     n?: number,
    //     filter?: Record<string, unknown>,
    //     from?: string,
    //     to?: string
    // ) => Promise<unknown>
}
