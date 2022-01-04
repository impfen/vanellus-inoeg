// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Backend } from "../../backend"
import { VanellusError } from "../../errors/vanellusError"
import { ProviderData } from "../../interfaces"
import { Provider } from "../../provider"

export async function unverifiedProvider(
    backend: Backend
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
        },
    }

    const provider = await Provider.initialize(
        "provider",
        backend,
        providerData
    )

    const result = await provider.storeData()

    if (result instanceof VanellusError) return result

    return provider
}
