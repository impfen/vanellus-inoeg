import {
    ConfirmedProviderData,
    ECDHData,
    SignedAppointment,
    SignedData,
} from "../../interfaces"
import { AnonymousBackendService } from "./AnonymousBackendService"

export interface ProviderBackendService extends AnonymousBackendService {
    // get all published appointments from the backend
    getAppointments: ({
        from,
        to,
    }: {
        from: string
        to: string
    }) => SignedAppointment[]

    // publish all local appointments to the backend
    publishAppointments: ({
        signedAppointments,
    }: {
        signedAppointments: SignedData[]
    }) => boolean

    storeProviderData: ({
        encryptedData,
        code,
    }: {
        encryptedData: ECDHData
        code?: string
    }) => boolean

    checkProviderData: () => ConfirmedProviderData
}
