import {
    ApiSignedAppointments,
    ApiSignedPublicProvider,
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
    }) => ApiSignedAppointments;

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
    }) => ApiSignedAppointments[];

    getProvidersByZipCode: ({
        zipFrom,
        zipTo,
    }: {
        zipFrom: string;
        zipTo: string;
    }) => ApiSignedPublicProvider[];

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
