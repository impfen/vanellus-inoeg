import { KeyPair } from "../interfaces";
import { AbstractTransport } from "./AbstractTransport";
import type {
    MethodParamsIfExists,
    ReturnTypeOfMethodIfExists,
} from "./Transport";
import { TransportError } from "./TransportError";

export interface RpcResponseError<TErrorData = unknown> {
    code: number;

    message: string;

    data?: TErrorData;
}

export interface RpcResponse<TResult, TErrorData = unknown> {
    jsonrpc: "2.0";

    result?: TResult;

    error?: RpcResponseError<TErrorData>;

    id: string | number | null;
}

/**
 * @todo JsonRpcErrors need to be handled properly
 */
export class JsonRpcTransport<TMethods> extends AbstractTransport<TMethods> {
    public async call<K extends keyof TMethods, TError = unknown>(
        method: K,
        params?: MethodParamsIfExists<TMethods, K>,
        keyPair?: KeyPair,
        id?: string
    ) {
        // console.log(method, params, keyPair)
        const callParams =
            typeof keyPair === "object"
                ? await this.signParams(params, keyPair)
                : params || {};

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
        });

        const rpcResponse = (await fetchResponse.json()) as RpcResponse<
            ReturnTypeOfMethodIfExists<TMethods, K>,
            TError
        >;

        if (!fetchResponse.ok || !rpcResponse.result) {
            console.log(method, rpcResponse);

            throw new TransportError(
                fetchResponse.statusText
                // data: JSON.stringify(rpcResponse),
            );
        }

        return rpcResponse?.result;
    }
}
