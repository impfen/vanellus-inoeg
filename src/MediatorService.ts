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

    public async confirmProvider(provider: Provider) {
        return this.mediatorApi.confirmProvider(provider, this.getKeyPairs());
    }

    /**
     *
     * @throws AuthError if proper keys are absent
     */
    public getPendingProviders(limit?: number) {
        return this.mediatorApi.getPendingProviders(this.getKeyPairs(), limit);
    }

    /**
     *
     * @throws AuthError if proper keys are absent
     */
    public getVerifiedProviders(limit?: number) {
        return this.mediatorApi.getVerifiedProviders(this.getKeyPairs(), limit);
    }

    protected getKeyPairs() {
        if (!this.keyPairs) {
            throw new AuthError();
        }

        return this.keyPairs;
    }
}
