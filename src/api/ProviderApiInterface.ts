import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    ApiConfirmedProviderData,
    ApiSignedAppointment,
    ECDHData,
    EncryptedProviderData,
    SignedData,
} from "./interfaces";

export interface ProviderApiInterface extends AnonymousApiInterface {
    // get all published appointments from the backend
    getProviderAppointments: ({
        from,
        to,
    }: {
        from: string;
        to: string;
    }) => ApiSignedAppointment[];

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
    }) => EncryptedProviderData;

    checkProviderData: () => ApiConfirmedProviderData;
}
