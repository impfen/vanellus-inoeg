// Kiebitz - Privacy-Friendly Appointments

import { buf2b64, str2ab } from "./conversion";

export const sha256 = async (rawData: string) => {
    return crypto.subtle.digest("SHA-256", str2ab(rawData)).then(buf2b64);
};
