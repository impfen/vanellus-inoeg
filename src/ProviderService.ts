import { MediatorApi } from "./api";
import { ProviderKeyPairs } from "./api/interfaces";
import { JsonRpcTransport } from "./api/transports/JsonRpcTransport";

export class ProviderService {
    protected mediatorApi: MediatorApi;
    protected keyPairs: ProviderKeyPairs | undefined;
    protected secret: string | undefined;

    public constructor(readonly apiUrl: string) {
        this.mediatorApi = new MediatorApi(new JsonRpcTransport(apiUrl));
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
}
