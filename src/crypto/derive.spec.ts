// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { equal } from "assert"
import { randomBytes, deriveSecrets } from "./"
import { b642buf } from "../helpers/conversion"

import crypto from "crypto"

// @ts-ignore
global.crypto = crypto.webcrypto

describe("Crypto.deriveSecrets()", function () {
    it("should be able to derive secrets", async function () {
        const passcode = randomBytes(16)
        const idAndKey = await deriveSecrets(b642buf(passcode), 32, 2)
        equal(idAndKey[0].length, 44)
    })
})
