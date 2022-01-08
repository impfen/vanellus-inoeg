import { dayjs } from "../../utils";
import { KeyPair } from "../interfaces";
import { sign } from "../utils";
import {
    MethodParamsIfExists,
    ReturnTypeOfMethodIfExists,
    Transport,
} from "./Transport";

export abstract class AbstractTransport<TMethods = any>
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
     * @throws VanellusError
     */
    public abstract call<K extends keyof TMethods>(
        method: K,
        params?: MethodParamsIfExists<TMethods, K>,
        keyPair?: KeyPair
    ): Promise<ReturnTypeOfMethodIfExists<TMethods, K>>;

    protected async signParams(params: unknown, keyPair: KeyPair) {
        const dataToSign = Object.assign({}, params || {}, {
            timestamp: dayjs().utc().toISOString(),
        });

        return sign(
            JSON.stringify(dataToSign),
            keyPair.privateKey,
            keyPair.publicKey
        );
    }
}
