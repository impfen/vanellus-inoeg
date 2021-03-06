// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { base64ToBuffer, deriveSecrets, randomBytes } from "../../utils";

describe("Crypto.deriveSecrets()", () => {
    it("should be able to derive secrets", async () => {
        const passcode = randomBytes(16);
        const idAndKey = await deriveSecrets(base64ToBuffer(passcode), 32, 2);

        expect(idAndKey[0]).toHaveLength(44);
    });
});
