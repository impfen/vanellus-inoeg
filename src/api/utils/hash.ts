// Kiebitz - Privacy-Friendly Appointments

import { buf2b64 } from "./conversion";

export const sha256 = async (message: string | Buffer) => {
    return crypto.subtle.digest("SHA-256", Buffer.from(message)).then(buf2b64);
};
