// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { buf2b64 } from "./conversion";

export const randomBytes = (length: number) => {
    const bytesBuffer = new Uint8Array(length);

    crypto.getRandomValues(bytesBuffer);

    return buf2b64(bytesBuffer);
};
