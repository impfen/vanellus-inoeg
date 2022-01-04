// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { equal } from "assert"
import { Actor } from "../actor"
import { VanellusError } from "../errors"
import { adminKeys, backend } from "../testing/fixtures"

describe("Anonymous.getKeys()", function () {
    it("we should be able to get the public keys anonymously", async function () {
        const be = backend()
        const keys = await adminKeys()

        const actor = new Actor("anonymous", "anonymous", be)

        const result = await actor.getKeys()

        if (result instanceof VanellusError) throw new Error("failed")

        equal(result.keys.rootKey, keys.root.publicKey)
        equal(result.keys.tokenKey, keys.token.publicKey)
        equal(result.keys.providerData, keys.provider.publicKey)
    })
})
