import { MediatorApi } from "./api";
import { MediatorKeyPairs, Provider } from "./api/interfaces";
import { JsonRpcTransport } from "./api/transports/JsonRpcTransport";
import { AuthError } from "./errors/AuthError";
import { Config } from "./interfaces";
/**
 * High-level-API for the mediator.
 */
export class MediatorService {
    protected mediatorApi: MediatorApi;
    protected keyPairs: MediatorKeyPairs | undefined;

    public constructor(config: Config) {
        this.mediatorApi = new MediatorApi(
            new JsonRpcTransport(config.endpoints.appointments)
        );
    }

    public authenticate(keyPairs: MediatorKeyPairs) {
        this.keyPairs = keyPairs;

        return true;
    }

    public isAuthenticated() {
        return !!this.keyPairs;
    }

    public logout() {
        this.keyPairs = undefined;

        return true;
    }

    public async confirmProvider(provider: Provider) {
        return this.mediatorApi.confirmProvider(provider, this.getKeyPairs());
    }

    /**
     *
     * @throws AuthError if proper keys are absent
     */
    public getPendingProviders() {
        return this.mediatorApi.getPendingProviders(this.getKeyPairs());
    }

    /**
     *
     * @throws AuthError if proper keys are absent
     */
    public getVerifiedProviders() {
        return this.mediatorApi.getVerifiedProviders(this.getKeyPairs());
    }

    protected getKeyPairs() {
        if (!this.keyPairs) {
            throw new AuthError();
        }

        return this.keyPairs;
    }
}
