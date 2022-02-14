import { base64url } from "@scure/base";
import { Buffer } from "buffer";

// https://base64.guru/standards/base64url
export const encodeBase64url = (string: string | Buffer | Uint8Array) => {
    return base64url.encode(Buffer.from(string));
};

export const decodeBase64url = (encodedString: string) => {
    return Buffer.from(base64url.decode(encodedString)).toString();
};
