// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { base32Decode, base32Encode } from "@ctrl/ts-base32";
import { Buffer } from "buffer";

export const encodebase32 = (string: string | Buffer) => {
    return base32Encode(Buffer.from(string), "Crockford");
};

export const decodeBase32 = (base32: string) => {
    return Buffer.from(base32Decode(base32, "Crockford")).toString();
};

export const buf2b64 = (buffer: ArrayBufferLike) => {
    return Buffer.from(buffer).toString("base64");
};

export const b642buf = (base64: string) => {
    return Buffer.from(base64, "base64");
};

export const str2ab = (str: string) => {
    return new TextEncoder().encode(str);
};

export const ab2str = (buf: ArrayBufferLike) => {
    return new TextDecoder().decode(new Uint8Array(buf));
};
