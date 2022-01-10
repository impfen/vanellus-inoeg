import { JsonRpcTransport, ProviderApi } from "./api";
import { createAppointmentSet } from "./api/utils";
import { AuthError } from "./errors";
import {
    Appointment,
    Config,
    ProviderInput,
    ProviderKeyPairs,
} from "./interfaces";

export class ProviderService {
    protected providerApi: ProviderApi;
    protected keyPairs: ProviderKeyPairs | undefined;
    protected secret: string | undefined;

    public constructor(readonly config: Config) {
        this.providerApi = new ProviderApi(
            new JsonRpcTransport(config.endpoints.appointments)
        );
    }

    public async authenticate(secret: string, keyPairs: ProviderKeyPairs) {
        this.secret = secret;
        this.keyPairs = keyPairs;

        await this.getAuthenticatedProvider();

        const backupData = await this.providerApi.restoreFromBackup(secret);

        return true;
    }

    public isAuthenticated() {
        return !!this.keyPairs && !!this.secret;
    }

    public logout() {
        this.secret = undefined;
        this.keyPairs = undefined;

        return true;
    }

    public async createAppointment(
        startDate: Date,
        duration: number,
        vaccine: string,
        slotCount: number
    ) {
        const provider = await this.getAuthenticatedProvider();

        if (!provider) {
            throw new AuthError("");
        }

        return this.providerApi.createAppointment(
            startDate,
            duration,
            vaccine,
            slotCount,
            provider,
            this.getKeyPairs()
        );
    }

    public async createAppointmentSet(
        startDate: Date,
        endDate: Date,
        interval: number,
        vaccine: string,
        lanes: number
    ) {
        const provider = await this.getAuthenticatedProvider();

        if (!provider) {
            throw new AuthError("");
        }

        return createAppointmentSet(
            startDate,
            endDate,
            interval,
            lanes,
            vaccine,
            provider,
            this.getKeyPairs()
        );
    }

    public async getProviderAppointments(from: Date, to: Date) {
        return this.providerApi.getProviderAppointments(
            from,
            to,
            this.getKeyPairs()
        );
    }

    public async publishAppointments(unpublishedAppointments: Appointment[]) {
        return this.providerApi.publishAppointments(
            unpublishedAppointments,
            this.getKeyPairs()
        );
    }

    public async cancelAppointment(appointment: Appointment) {
        return this.providerApi.cancelAppointment(
            appointment,
            this.getKeyPairs()
        );
    }

    public async storeUnverifiedProvider(
        providerInput: ProviderInput,
        code?: string
    ) {
        return this.providerApi.storeUnverifiedProvider(
            providerInput,
            this.getKeyPairs(),
            code
        );
    }

    protected getAuthenticatedProvider() {
        return this.providerApi.getVerifiedProvider(this.getKeyPairs());
    }

    protected getKeyPairs() {
        if (!this.keyPairs) {
            throw new AuthError();
        }

        return this.keyPairs;
    }
}
