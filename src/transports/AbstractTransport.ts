// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import dayjs from "dayjs";
import type { KeyPair } from "../interfaces";
import { sign } from "../utils";
import type {
    MethodParamsIfExists,
    ReturnTypeOfMethodIfExists,
    Transport,
} from "./Transport";

export abstract class AbstractTransport<TMethods>
    implements Transport<TMethods>
{
    constructor(protected readonly apiUrl: string) {}

    /**
     *
     * @param method
     * @param params
     * @param keyPair
     * @param id
     *
     * @throws TransportError
     */
    public abstract call<K extends keyof TMethods>(
        method: K,
        params?: MethodParamsIfExists<TMethods, K>,
        keyPair?: KeyPair
    ): Promise<ReturnTypeOfMethodIfExists<TMethods, K>>;

    protected async signParams(params: unknown, keyPair: KeyPair) {
        const dataToSign = Object.assign({}, params || {}, {
            timestamp: dayjs.utc().toISOString(),
        });

        return sign(
            JSON.stringify(dataToSign),
            keyPair.privateKey,
            keyPair.publicKey
        );
    }
}
