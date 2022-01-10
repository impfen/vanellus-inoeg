// Kiebitz - Privacy-Friendly Appointments

import { buf2b64 } from "./conversion";

export const sha256 = async (message: string) => {
    return crypto.subtle
        .digest("SHA-256", Buffer.from(message, "base64"))
        .then(buf2b64);
};
