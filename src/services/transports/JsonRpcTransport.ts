import { KeyPair } from "../.."
import { BackendError } from "../../errors"
import { AbstractTransport } from "./AbstractTransport"
import type {
    MethodParamsIfExists,
    ReturnTypeOfMethodIfExists,
} from "./Transport"

export interface RpcResponseError<TErrorData = unknown> {
    code: number

    message: string

    data?: TErrorData
}

export interface RpcResponse<TResult, TErrorData = unknown> {
    jsonrpc: "2.0"

    result?: TResult

    error?: RpcResponseError<TErrorData>

    id: string | number | null
}

/**
 * @todo JsonRpcErrors need to be handled properly
 */
export class JsonRpcTransport<TMethods> extends AbstractTransport<TMethods> {
    public async call<K extends keyof TMethods, TError = any>(
        method: K,
        params: MethodParamsIfExists<TMethods, K>,
        keyPair?: KeyPair,
        id?: string
    ) {
        const callParams =
            typeof keyPair === "object"
                ? await this.signParams(params, keyPair)
                : params

        const fetchResponse = await fetch(this.apiUrl, {
            method: "POST",
            headers: {
                ["Content-Type"]: "application/json",
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: method,
                params: callParams,
                id: id,
            }),
        })

        const rpcResponse = (await fetchResponse.json()) as RpcResponse<
            ReturnTypeOfMethodIfExists<TMethods, K>,
            TError
        >

        if (!fetchResponse.ok || !rpcResponse.result) {
            throw new BackendError({
                error: fetchResponse.statusText,
                data: JSON.stringify(rpcResponse),
            })
        }

        return rpcResponse.result
    }
}
