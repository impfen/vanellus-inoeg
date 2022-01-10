import { AnonymousApiInterface } from "./AnonymousApiInterface";
import { ActorKeyPairs, Config } from "./interfaces";
import { JsonRpcTransport, Transport } from "./transports";

export class AbstractApi<
    Api = AnonymousApiInterface,
    KP extends ActorKeyPairs | undefined = undefined
> {
    protected transport: Transport<Api, KP>;

    public constructor(readonly config: Config) {
        this.transport = new JsonRpcTransport<Api>(
            config.endpoints.appointments
        );
    }
}
