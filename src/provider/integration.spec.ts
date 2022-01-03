// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { equal } from "assert"
import { Status } from "../interfaces"
import { User } from "../user"
import { Provider } from "./"
import {
    adminKeys,
    backend,
    mediator,
    resetDB,
    unverifiedProvider,
} from "../testing/fixtures"

import { aesDecrypt, aesEncrypt, deriveSecrets } from "../crypto"
import { base322buf, b642buf } from "../helpers/conversion"

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { VanellusError } from '../errors'

describe("Provider integration", function () {
    it ("create and authenticate a provider and work with appointments", async function () {

        // set up utc timezone so tests work reliably
        dayjs.extend(utc)

        const be = backend()
        const keys = await adminKeys()
        let result

        await resetDB(be, keys)


        // create mediator
        const med = await mediator(be, keys)
        if ("code" in med) throw new Error("creating mediator failed")


        //create provider
        let provider = await Provider.initialize(
            "provider",
            be,
            {
                name: "Max Mustermann",
                street: "Musterstr. 23",
                city: "Berlin",
                zipCode: "10707",
                description: "",
                email: "max@mustermann.de",
            }
        )

        equal(provider.secret.length, 24)

        result = await provider.storeData()

        if (result instanceof VanellusError)
            throw new Error("cannot store provider data")


        // provider backup and recovery

        result = await provider.backupData()
        if (!("data" in result)) throw new Error("backup failed")

        const encryptedKeyFile = result.data
        const providerSecret = provider.secret

        // delete local provider data
        await provider.clear()
        provider = new Provider("new provider", be)
        provider.secret = providerSecret

        // and attpemt restore
        await provider.restoreFromBackup(encryptedKeyFile)
        if (provider.data === null)
            throw new Error("data should not be empty after restore")

        equal(provider.data.name, "Max Mustermann")

        // confirm provider
        const pendingProviders = await med.pendingProviders()
        if (pendingProviders instanceof VanellusError || pendingProviders.providers.length == 0) {
            throw new Error("fetching provider data failed")
        }

        result = await med.confirmProvider(pendingProviders.providers[0])
        if (result instanceof VanellusError) throw new Error("confirmation failed")

        await provider.restoreFromBackup(encryptedKeyFile)
    })
})
