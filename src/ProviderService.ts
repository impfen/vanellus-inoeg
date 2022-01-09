import { ProviderApi } from "./api";
import {
    Appointment,
    Config,
    ProviderInput,
    ProviderKeyPairs,
} from "./api/interfaces";
import { JsonRpcTransport } from "./api/transports/JsonRpcTransport";
import { AuthError } from "./errors";

export class ProviderService {
    protected providerApi: ProviderApi;
    protected keyPairs: ProviderKeyPairs | undefined;
    protected secret: string | undefined;

    public constructor(readonly config: Config) {
        this.providerApi = new ProviderApi(
            new JsonRpcTransport(config.endpoints.appointments)
        );
    }

    public authenticate(secret: string, keyPairs: ProviderKeyPairs) {
        this.secret = secret;
        this.keyPairs = keyPairs;

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
        duration: number,
        vaccine: string,
        slotCount: number,
        timestamp: Date
    ) {
        const provider = await this.getAuthenticatedProvider();

        if (!provider) {
            throw new AuthError("");
        }

        return this.providerApi.createAppointment(
            duration,
            vaccine,
            slotCount,
            timestamp,
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

    public async storeProvider(providerInput: ProviderInput, code?: string) {
        return this.providerApi.storeProvider(
            providerInput,
            this.getKeyPairs(),
            code
        );
    }

    protected getAuthenticatedProvider() {
        return this.providerApi.getProvider(this.getKeyPairs());
    }

    protected getKeyPairs() {
        if (!this.keyPairs) {
            throw new AuthError();
        }

        return this.keyPairs;
    }
}
