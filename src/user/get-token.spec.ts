// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Status } from "../interfaces"
import { equal } from "assert"
import { formatDate } from "../helpers/time"
import { backend } from "../testing/fixtures"
import { User } from "./"
import { VanellusError } from '../errors'

describe("User.getToken()", function () {
    it("we should be able to get a token", async function () {
        const be = backend()
        const user = new User("main", be)
        // we generate a secret etc.
        await user.initialize()
        // we set the queue data
        user.queueData = {
            zipCode: "10707",
        }
        // we set the contact data
        user.contactData = {
            name: "Max Mustermann",
        }

        const result = await user.getToken({})

        if (result instanceof VanellusError)
            throw new Error("should not fail")

        equal(result.tokenData.userToken.version, "0.3")
    })
})
