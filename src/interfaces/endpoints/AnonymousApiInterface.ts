// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type {
    ApiAggregatedProviderAppointment,
    ApiProviderAppointments,
    ApiSignedProviderData,
    BackendPublicKeys,
} from "../api";
import type { Configurables } from "../Configurables";
import type { StorageApiInterface } from "./StorageApiInterface";

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
    }: {
        zipCode: string;
        from: string;
        to: string;
        radius?: number;
    }) => ApiProviderAppointments[];

    getAppointmentsAggregated: ({
        date,
        zipFrom,
        zipTo,
    }: {
        date: string;
        zipFrom: string;
        zipTo: string;
    }) => ApiAggregatedProviderAppointment[];

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
