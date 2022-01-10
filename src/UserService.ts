import { AnonymousApi, JsonRpcTransport, UserApi } from "./api";
import { AuthError } from "./errors";
import { Appointment, Config, ContactData, UserQueueToken } from "./interfaces";

export class UserService {
    protected userApi: UserApi;
    protected anonymousApi: AnonymousApi;
    protected secret?: string;
    protected userQueueToken?: UserQueueToken;

    public constructor(readonly config: Config) {
        this.userApi = new UserApi(
            new JsonRpcTransport(config.endpoints.appointments)
        );

        this.anonymousApi = new AnonymousApi(
            new JsonRpcTransport(config.endpoints.appointments)
        );
    }

    public async authenticate(secret: string) {
        this.secret = secret;

        await this.restore();

        return true;
    }

    public isAuthenticated() {
        return !!this.secret;
    }

    public async logout() {
        await this.backup();

        this.secret = undefined;

        return true;
    }

    public async register(contactData?: ContactData, inviteCode?: string) {
        this.secret = this.userApi.generateSecret();

        this.userQueueToken = await this.userApi.getQueueToken(
            this.secret,
            contactData,
            inviteCode
        );
    }

    public async backup() {
        if (!this.secret) {
            throw new AuthError("User not authenticated");
        }

        const result = await this.userApi.backupData(
            {
                userQueueToken: this.userQueueToken,
                acceptedAppointments: [],
            },
            this.secret
        );

        return result;
    }

    public async restore() {
        if (!this.secret) {
            throw new AuthError("User not authenticated");
        }

        const result = await this.userApi.restoreFromBackup(this.secret);
    }

    public async getAppointment(appointmentId: string, providerID: string) {
        return this.anonymousApi.getAppointment(appointmentId, providerID);
    }

    public async getAppointmentsByZipCode(
        zipCode: string,
        from: Date,
        to: Date,
        radius = 50
    ) {
        return this.anonymousApi.getAppointmentsByZipCode(
            zipCode,
            from,
            to,
            radius
        );
    }

    public async getProvidersByZipCode(zipFrom: string, zipTo?: string) {
        return this.anonymousApi.getProvidersByZipCode(
            zipFrom,
            zipTo ? zipTo : zipFrom
        );
    }

    public async bookAppointment(
        appointment: Appointment,
        userQueueToken: UserQueueToken
    ) {
        return this.userApi.bookAppointment(appointment, userQueueToken);
    }

    public async cancelBooking(
        appointment: Appointment,
        userQueueToken: UserQueueToken
    ) {
        return this.userApi.cancelBooking(appointment, userQueueToken);
    }
}
