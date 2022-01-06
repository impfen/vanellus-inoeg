import { KeyPair } from "../../interfaces"

export type ReturnTypeOfMethod<T> = T extends (...args: Array<any>) => any
    ? ReturnType<T>
    : unknown

export type ReturnTypeOfMethodIfExists<T, S> = S extends keyof T
    ? ReturnTypeOfMethod<T[S]>
    : unknown

export type MethodParams<T> = T extends (...args: infer P) => any ? P[0] : T

export type MethodParamsIfExists<T, S> = S extends keyof T
    ? MethodParams<T[S]>
    : S

export interface Transport<TMethods> {
    /**
     *
     * @param method
     * @param params
     * @param keyPair
     * @param id
     *
     * @throws VanellusError
     */
    call<K extends keyof TMethods, TError = any>(
        method: K,
        params: MethodParamsIfExists<TMethods, K>,
        keyPair?: KeyPair
    ): Promise<ReturnTypeOfMethodIfExists<TMethods, K> | TError>
}
