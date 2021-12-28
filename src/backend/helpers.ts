// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { RPCResponse, RPCError } from "../interfaces"

export async function e<T>(call: Promise<RPCResponse>): Promise<RPCError | T> {
    const response = await call
    if (response.error) return response.error
    return response.result as T
}
