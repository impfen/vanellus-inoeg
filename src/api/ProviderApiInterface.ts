import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    ApiProviderProviderAppointments,
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

    checkProviderData: () => SignedData;
}
