import { MediatorApi } from "./api";
import { MediatorKeyPairs } from "./api/interfaces";
import { JsonRpcTransport } from "./api/transports/JsonRpcTransport";
import { AuthError } from "./errors/AuthError";

export class MediatorService {
    protected mediatorApi: MediatorApi;
    protected keyPairs: MediatorKeyPairs | undefined;

    public constructor(readonly apiUrl: string) {
        this.mediatorApi = new MediatorApi(new JsonRpcTransport(apiUrl));
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

    /**
     *
     * @throws AuthError if proper keys are absent
     */
    public getPendingProviders() {
        if (!this.keyPairs) {
            throw new AuthError();
        }

        return this.mediatorApi.getPendingProviders(this.keyPairs);
    }

    /**
     *
     * @throws AuthError if proper keys are absent
     */
    public getVerifiedProviders() {
        if (!this.keyPairs) {
            throw new AuthError();
        }

        return this.mediatorApi.getVerifiedProviders(this.keyPairs);
    }
}
