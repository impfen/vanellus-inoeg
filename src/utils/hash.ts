// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Buffer } from "buffer";
import { bufferToBase64 } from "./conversion";

export const sha256 = async (message: string | Buffer) => {
    return crypto.subtle
        .digest("SHA-256", Buffer.from(message))
        .then(bufferToBase64);
};
