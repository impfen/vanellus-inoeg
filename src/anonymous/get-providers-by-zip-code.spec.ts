// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { deepEqual, equal } from "assert"
import { Actor } from "../actor"
import { VanellusError } from "../errors"
import { PublicProviderData } from "../interfaces"
import { Provider } from "../provider"
import { adminKeys, backend, mediator, resetDB } from "../testing/fixtures"

describe("Anonymous.getProvidersByZipCode()", function () {
    it("create and authenticate a provider and work with appointments", async function () {

        const be = backend()
        const keys = await adminKeys()

        await resetDB(be, keys)

        // create mediator
        const med = await mediator(be, keys)
        if ("code" in med) throw new Error("creating mediator failed")

        //create providers
        let providerData = {
            name: "Max Mustermann",
            street: "Musterstr. 23",
            city: "Berlin",
            zipCode: "10115",
            description: "",
            email: "max@mustermann.de",
            accessible: true,
        }
        const p1 = await Provider.initialize("provider1", be, providerData)
        const r1 = await p1.storeData()
        if (r1 instanceof VanellusError)
            throw new Error("store data for p1 failed")

        providerData.zipCode = "60312"
        const p2 = await Provider.initialize("provider2", be, providerData)
        const r2 = await p2.storeData()
        if (r2 instanceof VanellusError)
            throw new Error("store data for p2 failed")

        providerData.zipCode = "65936"
        const p3 = await Provider.initialize("provider3", be, providerData)
        const r3 = await p3.storeData()
        if (r3 instanceof VanellusError)
            throw new Error("store data for p3 failed")

        providerData.zipCode = "96050"
        const p4 = await Provider.initialize("provider4", be, providerData)
        const r4 = await p4.storeData()
        if (r4 instanceof VanellusError)
            throw new Error("store data for p4 failed")

        // confirm providers
        const pendingProviders = await med.pendingProviders()
        if (pendingProviders instanceof VanellusError)
            throw new Error("fetching provider data failed")
        for ( let pending of pendingProviders.providers ) {
            const confirmResult = await med.confirmProvider(pending)
            if ("error" in confirmResult) throw new Error("confirmation failed")
        }

        // create anonymous user and query providers
        const user = new Actor("anon", "anon", be)
        const result = await user.getProvidersByZipCode("60000", "69999")

        if (result instanceof VanellusError) {
            throw new Error("can't fetch providers by zip code")
        }

        equal(result.providers.length, 2)
        deepEqual(
            result.providers.map( (p:PublicProviderData) => p.zipCode).sort(),
            ["60312", "65936"]
        )
    })
})

