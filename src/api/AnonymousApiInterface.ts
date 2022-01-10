import {
    ApiProviderAppointments,
    ApiSignedProviderData,
    BackendPublicKeys,
    Configurables,
} from "./interfaces";
import { StorageApiInterface } from "./StorageApiInterface";

export interface AnonymousApiInterface extends StorageApiInterface {
    getAppointment: ({
        id,
        providerID,
    }: {
        id: string;
        providerID: string;
    }) => ApiProviderAppointments;

    getAppointmentsByZipCode: ({
        zipCode,
        from,
        to,
        radius,
        aggregate,
    }: {
        zipCode: string;
        from: string;
        to: string;
        radius?: number;
        aggregate?: boolean;
    }) => ApiProviderAppointments[];

    getProvidersByZipCode: ({
        zipFrom,
        zipTo,
    }: {
        zipFrom: string;
        zipTo: string;
    }) => ApiSignedProviderData[];

    // return all public keys present in the system
    getKeys: () => BackendPublicKeys;

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
