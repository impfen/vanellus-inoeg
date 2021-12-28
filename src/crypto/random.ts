// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Buffer } from "buffer"
import { buf2b64 } from "../helpers/conversion"

export function randomBytes(n: number) {
    const array = new Uint8Array(n)
    crypto.getRandomValues(array)
    return buf2b64(Buffer.from(array))
}
