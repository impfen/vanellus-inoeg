// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { AdminKeys } from "./"
import { Backend } from "../../backend"
import { Mediator } from "../../mediator"
import { Provider } from "../../provider"
import { unverifiedProvider } from "./unverified-provider"
import { DecryptedProviderData, EncryptedProviderData, ProviderData, Status } from "../../interfaces"
import { ErrorCode, VanellusError } from '../../errors'

export async function verifiedProvider(
    backend: Backend,
    adminKeys: AdminKeys,
    mediator: Mediator
): Promise<Provider | VanellusError> {
    const provider = await unverifiedProvider(backend, adminKeys)

    const pendingProviders = await mediator.pendingProviders()
    if (pendingProviders instanceof VanellusError) return pendingProviders;

    const pendingProvider = pendingProviders.providers.find(
        (pr: DecryptedProviderData) =>
            pr.data.publicKeys.signing === provider.keyPairs?.signing.publicKey
    )

    if (!pendingProvider) throw new Error("no pending provider found")

    const result = await mediator.confirmProvider(pendingProvider)

    if (result instanceof VanellusError) return result

    return provider
}
