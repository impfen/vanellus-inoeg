import {
    ProviderAppointments,
    PublicKeys,
    SignedProviderData,
} from "../../interfaces"
import { StorageBackendService } from "./StorageBackendService"

export interface AnonymousBackendService extends StorageBackendService {
    getAppointment: ({
        id,
        providerID,
    }: {
        id: string
        providerID: string
    }) => Promise<ProviderAppointments>

    getAppointmentsByZipCode: ({
        zipCode,
        radius,
        from,
        to,
    }: {
        zipCode: string
        radius: number
        from: string
        to: string
    }) => Promise<ProviderAppointments[]>

    getProvidersByZipCode: ({
        zipFrom,
        zipTo,
    }: {
        zipFrom: string
        zipTo: string
    }) => Promise<SignedProviderData[]>

    // return all public keys present in the system
    getKeys: () => Promise<PublicKeys>

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
