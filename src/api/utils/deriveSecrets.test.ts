// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { deriveSecrets, randomBytes } from ".";
import { b642buf } from "./conversion";

describe("Crypto.deriveSecrets()", () => {
    it("should be able to derive secrets", async () => {
        const passcode = randomBytes(16);
        const idAndKey = await deriveSecrets(b642buf(passcode), 32, 2);

        expect(idAndKey[0]).toHaveLength(44);
    });
});
