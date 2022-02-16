// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { ProviderStatus } from "..";
import type {
    ApiProviderProviderAppointments,
    ApiSignedProvider,
    ECDHData,
    SignedData,
} from "../api";
import type { AnonymousApiInterface } from "./AnonymousApiInterface";

export interface ProviderApiInterface extends AnonymousApiInterface {
    // get all published appointments from the backend
    getProviderAppointments: ({
        from,
        to,
        updatedSince,
    }: {
        from: string;
        to: string;
        updatedSince?: string;
    }) => ApiProviderProviderAppointments;

    // get all published appointments with a specific property
    getProviderAppointmentsByProperty: ({
        key,
        value,
    }: {
        key: string;
        value: string;
    }) => ApiProviderProviderAppointments;

    // publish all local appointments to the backend
    publishAppointments: ({
        appointments,
    }: {
        appointments: SignedData[];
    }) => boolean;

    storeProviderData: ({
        encryptedData,
        code,
    }: {
        encryptedData: ECDHData;
        code?: string;
    }) => "ok";

    // retrieve verified data of the provider
    checkProviderData: () => ApiSignedProvider;

    // retrieve statsu of the provider
    checkProviderStatus: () => ProviderStatus;

    // check if the provider is recognized in the backend
    isValidProvider: () => boolean;

    // check if the provider is recognized in the backend and validated
    isValidatedProvider: () => boolean;
}
