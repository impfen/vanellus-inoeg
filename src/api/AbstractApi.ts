import { AnonymousApiInterface } from "./AnonymousApiInterface";
import { ActorKeyPairs } from "./interfaces";
import { Transport } from "./transports";

export class AbstractApi<
    Api = AnonymousApiInterface,
    KP extends ActorKeyPairs | undefined = undefined
> {
    public constructor(protected readonly transport: Transport<Api, KP>) {}
}
