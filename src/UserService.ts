import { UserApi } from ".";
import { JsonRpcTransport } from "./api/transports";

export class UserService {
    protected userApi: UserApi;

    protected secret: string | undefined;

    public constructor(readonly apiUrl: string) {
        this.userApi = new UserApi(new JsonRpcTransport(apiUrl));
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
}
