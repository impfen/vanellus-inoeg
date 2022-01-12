import { AnonymousApi, UserApi } from "./api";
import { AuthError } from "./errors";
import { Appointment, Config, ContactData, UserQueueToken } from "./interfaces";

export class UserService {
    protected userApi: UserApi;
    protected anonymousApi: AnonymousApi;

    protected secret?: string;
    protected userQueueToken?: UserQueueToken;

    public constructor(readonly config: Config) {
        this.userApi = new UserApi(config);
        this.anonymousApi = new AnonymousApi(config);
    }

    public async authenticate(secret: string) {
        return this.restore(secret);
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
        if (!this.secret) {
            this.secret = this.userApi.generateSecret();
        }

        if (!this.userQueueToken) {
            this.userQueueToken = await this.userApi.getQueueToken(
                this.secret,
                contactData,
                inviteCode
            );
        }

        return this.userQueueToken;
    }

    public async backup() {
        if (!this.secret) {
            throw new AuthError("User not authenticated");
        }

        return this.userApi.backupData(
            {
                userQueueToken: this.userQueueToken,
                bookings: [],
            },
            this.secret
        );
    }

    public async restore(secret: string) {
        const backup = await this.userApi.restoreFromBackup(secret);

        this.secret = secret;
        this.userQueueToken = backup.userQueueToken;
    }

    public async getAppointment(appointmentId: string, providerId: string) {
        return this.anonymousApi.getAppointment(
            appointmentId,
            providerId,
            true
        );
    }

    public async getAppointments(
        zipCode: number,
        from: Date,
        to: Date,
        radius = 50
    ) {
        return this.anonymousApi.getAppointments(zipCode, from, to, radius);
    }

    public async getProviders(zipFrom: string, zipTo?: string) {
        return this.anonymousApi.getProviders(zipFrom, zipTo ? zipTo : zipFrom);
    }

    public async bookAppointment(appointment: Appointment) {
        const userQueueToken = await this.register();

        return this.userApi.bookAppointment(appointment, userQueueToken);
    }

    public async cancelBooking(appointment: Appointment) {
        if (!this.userQueueToken) {
            throw new AuthError(
                "You are not authorized. Please restore your backup first"
            );
        }

        return this.userApi.cancelBooking(appointment, this.userQueueToken);
    }

    public async getConfigurables() {
        return this.anonymousApi.getConfigurables();
    }
}
