// Kiebitz - Privacy-Friendly Appointments

import { bufferToBase64 } from "./conversion";

export const sha256 = async (message: string | Buffer) => {
    return crypto.subtle
        .digest("SHA-256", Buffer.from(message))
        .then(bufferToBase64);
};
