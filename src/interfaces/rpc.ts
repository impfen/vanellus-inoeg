// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

export interface RPCResponse<Result = any> {
    jsonrpc: string
    id: string
    error?: RPCError
    result?: Result
}

export type OK = "ok"

export interface RPCResult {
    id: string
    result: any
}

export interface RPCError {
    code: number
    message: string
    data?: any
}
