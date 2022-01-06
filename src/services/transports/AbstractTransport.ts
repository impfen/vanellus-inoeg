import { sign } from "../../crypto"
import { KeyPair } from "../../interfaces"
import {
    MethodParamsIfExists,
    ReturnTypeOfMethodIfExists,
    Transport,
} from "./Transport"

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
     * @throws VanellusError
     */
    public abstract call<K extends keyof TMethods>(
        method: K,
        params: MethodParamsIfExists<TMethods, K>,
        keyPair?: KeyPair
    ): Promise<ReturnTypeOfMethodIfExists<TMethods, K>>

    protected async signParams(params: any, keyPair: KeyPair) {
        const dataToSign = {
            ...params,
            timestamp: new Date().toISOString(),
        }

        return sign(
            keyPair.privateKey,
            JSON.stringify(dataToSign),
            keyPair.publicKey
        )
    }
}
