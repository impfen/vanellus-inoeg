// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { ActorKeyPairs } from "../interfaces";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReturnTypeOfMethod<T> = T extends (...args: Array<any>) => any
    ? ReturnType<T>
    : unknown;

export type ReturnTypeOfMethodIfExists<Methods, MethodName> =
    MethodName extends keyof Methods
        ? ReturnTypeOfMethod<Methods[MethodName]>
        : unknown;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MethodParams<T> = T extends (...args: infer Param) => any
    ? Param[0]
    : T;

export type MethodParamsIfExists<Methods, MethodName> =
    MethodName extends keyof Methods
        ? MethodParams<Methods[MethodName]>
        : MethodName;

export interface Transport<
    Api,
    KP extends ActorKeyPairs | undefined = undefined
> {
    /**
     *
     * @param method
     * @param params
     * @param keyPair
     * @param id
     *
     * @throws VanellusError
     */
    call<K extends keyof Api>(
        method: K
    ): Promise<ReturnTypeOfMethodIfExists<Api, K>>;
    call<K extends keyof Api>(
        method: K,
        params: MethodParamsIfExists<Api, K> extends undefined
            ? undefined
            : MethodParamsIfExists<Api, K>
    ): Promise<ReturnTypeOfMethodIfExists<Api, K>>;
    call<K extends keyof Api>(
        method: K,
        params: MethodParamsIfExists<Api, K> extends undefined
            ? undefined
            : MethodParamsIfExists<Api, K>,
        keyPair: KP extends ActorKeyPairs
            ? KP["signing"]
            : undefined | ActorKeyPairs["signing"]
    ): Promise<ReturnTypeOfMethodIfExists<Api, K>>;
}
