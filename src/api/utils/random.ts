// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { bufferToBase64 } from "./conversion";

export const randomBytes = (length: number) => {
    const bytesBuffer = new Uint8Array(length);

    crypto.getRandomValues(bytesBuffer);

    return bufferToBase64(bytesBuffer);
};
