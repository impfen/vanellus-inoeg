import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    ApiEncryptedProvider,
    ApiSignedProviderAppointment,
    ECDHData,
    SignedData,
} from "./interfaces";

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
    }) => ApiSignedProviderAppointment[];

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
    }) => ApiEncryptedProvider;

    checkProviderData: () => SignedData;
}
