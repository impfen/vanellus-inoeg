import { JsonRpcTransport, MediatorApi } from "./api";
import { AuthError } from "./errors";
import { Config, MediatorKeyPairs, Provider } from "./interfaces";

/**
 * High-level-API for the mediator.
 */
export class MediatorService {
    protected mediatorApi: MediatorApi;
    protected keyPairs?: MediatorKeyPairs;

    public constructor(readonly config: Config) {
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

    public async verifyProvider(provider: Provider) {
        return this.mediatorApi.verifyProvider(provider, this.getKeyPairs());
    }

    /**
     *
     * @throws AuthError if proper keys are absent
     */
    public getUnverifiedProviders() {
        return this.mediatorApi.getUnverifiedProviders(this.getKeyPairs());
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
