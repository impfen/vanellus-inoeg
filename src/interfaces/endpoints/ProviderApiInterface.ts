// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

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

    checkProviderData: () => ApiSignedProvider;
}
