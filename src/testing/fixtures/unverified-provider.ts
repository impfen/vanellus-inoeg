// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { AdminKeys } from "./"
import { ecdhEncrypt, ecdhDecrypt } from "../../crypto"
import { Backend } from "../../backend"
import { Provider } from "../../provider"
import { ProviderData, KeyPair, Status } from "../../interfaces"
import { VanellusError } from '../../errors/vanellusError'

export async function unverifiedProvider(
    backend: Backend,
): Promise<Provider | VanellusError> {
    const providerData: ProviderData = {
        name: "Max Mustermann",
        street: "Musterstr. 23",
        city: "Berlin",
        zipCode: "10707",
        description: "",
        email: "max@mustermann.de",
        publicKeys: {
            encryption: "",
            signing: "",
        }
    }

    const provider = await Provider.initialize(
        "provider",
        backend,
        providerData,
    )

    const result = await provider.storeData()

    if (result instanceof VanellusError)
        return result

    return provider
}
