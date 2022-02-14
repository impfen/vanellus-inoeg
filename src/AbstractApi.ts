// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type {
    ActorKeyPairs,
    AnonymousApiInterface,
    VanellusConfig,
} from "./interfaces";
import { JsonRpcTransport, type Transport } from "./transports";

export class AbstractApi<
    Api = AnonymousApiInterface,
    KP extends ActorKeyPairs | undefined = undefined
> {
    protected transport: Transport<Api, KP>;

    public constructor(readonly config: VanellusConfig) {
        this.transport = new JsonRpcTransport<Api>(config.jsonrpc.appointments);
    }
}
