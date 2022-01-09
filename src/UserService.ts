import { AnonymousApi, UserApi } from ".";
import { Config, QueueToken } from "./api/interfaces";
import { JsonRpcTransport } from "./api/transports";
import { AuthError } from "./errors";
import { Appointment, UserKeyPairs } from "./interfaces";

export class UserService {
    protected userApi: UserApi;
    protected anonymousApi: AnonymousApi;
    protected secret?: string;
    protected keyPairs?: UserKeyPairs;

    public constructor(readonly config: Config) {
        this.userApi = new UserApi(
            new JsonRpcTransport(config.endpoints.appointments)
        );
        this.anonymousApi = new AnonymousApi(
            new JsonRpcTransport(config.endpoints.appointments)
        );
    }

    public authenticate(secret: string) {
        this.secret = secret;

        return true;
    }

    public isAuthenticated() {
        return !!this.secret;
    }

    public logout() {
        this.secret = undefined;

        return true;
    }

    public async getAppointment(appointmentId: string, providerID: string) {
        return this.anonymousApi.getAppointment(appointmentId, providerID);
    }

    public async getAppointmentsByZipCode(
        zipCode: string,
        radius: number,
        from: Date,
        to: Date
    ) {
        return this.anonymousApi.getAppointmentsByZipCode(
            zipCode,
            radius,
            from,
            to
        );
    }

    public async getProvidersByZipCode(zipFrom: string, zipTo: string) {
        return this.anonymousApi.getProvidersByZipCode(zipFrom, zipTo);
    }

    public async bookAppointment(
        appointment: Appointment,
        queueToken: QueueToken
    ) {
        return this.userApi.bookAppointment(appointment, queueToken);
    }

    public async cancelAppointment(
        appointment: Appointment,
        queueToken: QueueToken
    ) {
        return this.userApi.cancelAppointment(appointment, queueToken);
    }

    protected getKeyPairs() {
        if (!this.keyPairs) {
            throw new AuthError();
        }

        return this.keyPairs;
    }
}
