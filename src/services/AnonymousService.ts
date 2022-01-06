import { AnonymousBackendService } from "./backend/AnonymousBackendService"
import { Transport } from "./transports/Transport"

export class AnonymousService {
    constructor(
        protected readonly transport: Transport<AnonymousBackendService>
    ) {}

    public async getAppointment(id: string, providerID: string) {
        return this.transport.call("getAppointment", {
            id,
            providerID,
        })
    }

    public async getAppointmentsByZipCode(
        zipCode: string,
        radius: number,
        from: string,
        to: string
    ) {
        return this.transport.call("getAppointmentsByZipCode", {
            zipCode,
            radius,
            from,
            to,
        })
    }

    public async getProvidersByZipCode(zipFrom: string, zipTo: string) {
        return this.transport.call("getProvidersByZipCode", { zipFrom, zipTo })
    }
}
