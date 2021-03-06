// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { AbstractApi } from "./AbstractApi";
import { UnexpectedError } from "./errors";
import {
    ProviderStatus,
    type ApiEncryptedProvider,
    type MediatorKeyPairs,
    type MediatorProviderView,
    type Provider,
    type ProviderPair,
    type PublicProvider,
    type QueueData,
    type SignedProvider,
} from "./interfaces";
import type { MediatorApiInterface } from "./interfaces/endpoints";
import {
    ecdhDecrypt,
    ephemeralECDHEncrypt,
    parseUntrustedJSON,
    sign,
} from "./utils";

export class MediatorApi extends AbstractApi<
    MediatorApiInterface,
    MediatorKeyPairs
> {
    /**
     * Confirm a given, unverified provider
     *
     * Workflow on server-side:
     *   - check unverifiedProvider(providerId)
     *      - not found
     *           - check verifiedProvider(providerId)
     *               - if found: error
     *       - found
     *           - delete from unverifiedProvider
     *           - save data to verifiedProvider
     *           - save ConfirmedProviderData encrypted for the provider into confirmedProvider
     *           - save PublicProviderData into publicProvider
     *
     * @return Promise<Provider>
     */
    public async confirmProvider(
        provider: Provider,
        mediatorKeyPairs: MediatorKeyPairs
    ) {
        const keyHashesData = {
            signing: provider.publicKeys.signing,
            encryption: provider.publicKeys.encryption,
            queueData: this.getQueueDataFromProvider(provider),
        };

        const publicProvider: PublicProvider = {
            id: provider.id,
            name: provider.name,
            street: provider.street,
            city: provider.city,
            zipCode: provider.zipCode,
            website: provider.website,
            description: provider.description,
            accessible: provider.accessible,
            version: provider.version,
            updatedAt: provider.updatedAt,
            createdAt: provider.createdAt,
        };

        const confirmedProvider: Provider = {
            id: provider.id,
            name: provider.name,
            street: provider.street,
            city: provider.city,
            zipCode: provider.zipCode,
            description: provider.description,
            accessible: provider.accessible,
            website: provider.website,
            email: provider.email,
            version: provider.version,
            updatedAt: provider.updatedAt,
            createdAt: provider.createdAt,
            publicKeys: provider.publicKeys,
        };

        const signedKeyData = await sign(
            JSON.stringify(keyHashesData),
            mediatorKeyPairs.signing.privateKey,
            mediatorKeyPairs.signing.publicKey
        );

        // this will be stored for the provider, so we add the public key data
        const signedProviderData = await sign(
            JSON.stringify(confirmedProvider),
            mediatorKeyPairs.signing.privateKey,
            mediatorKeyPairs.signing.publicKey
        );

        // this will be stored for the general public
        const signedPublicProviderData = await sign(
            JSON.stringify(publicProvider),
            mediatorKeyPairs.signing.privateKey,
            mediatorKeyPairs.signing.publicKey
        );

        const providerSignedData: SignedProvider = {
            signedData: signedProviderData,
            signedPublicData: signedPublicProviderData,
        };

        // we encrypt the data with the public key supplied by the provider
        const [encryptedProviderData] = await ephemeralECDHEncrypt(
            JSON.stringify(providerSignedData),
            provider.publicKeys.data
        );

        const signedEncryptedProviderData = await sign(
            JSON.stringify(encryptedProviderData),
            mediatorKeyPairs.signing.privateKey,
            mediatorKeyPairs.signing.publicKey
        );

        const result = await this.transport.call(
            "confirmProvider",
            {
                confirmedProviderData: signedEncryptedProviderData,
                publicProviderData: signedPublicProviderData,
                signedKeyData: signedKeyData,
            },
            mediatorKeyPairs.signing
        );

        if ("ok" !== result) {
            throw new UnexpectedError(
                `Couldn't verify provider ${provider.id}`
            );
        }

        return confirmedProvider;
    }

    /**
     * Returns the decrypted list of all providers
     *
     * @param mediatorKeyPairs  KeyPairs of the mediator
     * @param limit Max number of providers to return. Number between 1 and
     *        10000, defaults to 1000
     *
     * @return Promise<MediatorProviderView[]>
     */
    public async getProviders(
        mediatorKeyPairs: MediatorKeyPairs,
        limit = 1000
    ) {
        const encryptedProviders = await this.transport.call(
            "getProviders",
            { limit },
            mediatorKeyPairs.signing
        );

        return Promise.all(
            encryptedProviders.map(async (provider) => {
                const decryptedProvider = await this.decryptProvider(
                    provider,
                    mediatorKeyPairs
                );
                return <MediatorProviderView>{
                    ...decryptedProvider,
                    status: provider.status,
                };
            })
        );
    }

    /**
     * Returns the decrypted list of all pending providers
     *
     * A provider is pending until it is confirmed by a mediator.
     *
     * @param mediatorKeyPairs  KeyPairs of the mediator
     * @param limit             Max number of providers to return. Number between 1 and 10000, defaults to 1000;
     *
     * @return Promise<Provider[]>
     */
    public async getPendingProviders(
        mediatorKeyPairs: MediatorKeyPairs,
        limit = 1000
    ) {
        return this.decryptProviders(
            await this.transport.call(
                "getPendingProviderData",
                { limit },
                mediatorKeyPairs.signing
            ),
            mediatorKeyPairs
        );
    }

    /**
     * Returns the decrypted list of all verified providers
     *
     * A provider is verified after confirmation of a mediator.
     *
     * @param mediatorKeyPairs  KeyPairs of the mediator
     * @param limit             Max number of providers to return. Number between 1 and 10000, defaults to 1000;
     *
     * @return Promise<Provider[]>
     */
    public async getVerifiedProviders(
        mediatorKeyPairs: MediatorKeyPairs,
        limit = 1000
    ) {
        const verifiedProviders = await this.decryptProviders(
            await this.transport.call(
                "getVerifiedProviderData",
                { limit },
                mediatorKeyPairs.signing
            ),
            mediatorKeyPairs
        );

        return verifiedProviders;
    }

    /**
     * Returns a single decrypted provider
     *
     * A provider is pending until it is confirmed by a mediator.
     *
     * @return Promise<ProviderPair>
     */
    public async getProvider(
        providerId: string,
        mediatorKeyPairs: MediatorKeyPairs
    ) {
        const encryptedProvider = await this.transport.call(
            "getProviderData",
            { providerID: providerId },
            mediatorKeyPairs.signing
        );

        const unverifiedProvider = await this.decryptProvider(
            encryptedProvider.unverifiedData,
            mediatorKeyPairs
        );

        const verifiedProvider = encryptedProvider.verifiedData
            ? await this.decryptProvider(
                  encryptedProvider.verifiedData,
                  mediatorKeyPairs
              )
            : undefined;

        let status = ProviderStatus.UNVERIFIED;

        if (verifiedProvider) {
            if (
                unverifiedProvider &&
                JSON.stringify(unverifiedProvider) ===
                    JSON.stringify(verifiedProvider)
            ) {
                status = ProviderStatus.VERIFIED;
            } else {
                status = ProviderStatus.CHANGED;
            }
        }

        const providerPair: ProviderPair = {
            unverifiedProvider,
            verifiedProvider,
            status,
        };

        return providerPair;
    }

    /**
     * Checks if the backend recognizes our id as a mediator id
     *
     * @return Promise<boolean>
     */
    public async isValidKeyPairs(mediatorKeyPairs: MediatorKeyPairs) {
        return this.transport.call(
            "isValidMediator",
            undefined,
            mediatorKeyPairs.signing
        );
    }

    /**
     * Decrypts and parses an array of providerData objects returned by the services
     *
     * @return Promise<Provider[]>
     */
    protected async decryptProviders(
        encryptedProviderDatas: ApiEncryptedProvider[],
        mediatorKeyPairs: MediatorKeyPairs
    ) {
        return Promise.all(
            encryptedProviderDatas.map((encryptedProvider) =>
                this.decryptProvider(encryptedProvider, mediatorKeyPairs)
            )
        );
    }

    /**
     * Decrypts and parses a single providerData object returned by the services
     *
     * @return Promise<Provider>
     */
    protected async decryptProvider(
        apiProvider: ApiEncryptedProvider,
        mediatorKeyPairs: MediatorKeyPairs
    ) {
        const decryptedProviderDataString = await ecdhDecrypt(
            apiProvider.encryptedData,
            mediatorKeyPairs.provider.privateKey
        );

        const provider: Provider = {
            ...parseUntrustedJSON<Provider>(decryptedProviderDataString),
        };

        return provider;
    }

    protected getQueueDataFromProvider(provider: Provider) {
        const queueData: QueueData = {
            zipCode: provider.zipCode,
            accessible: provider.accessible,
        };

        return queueData;
    }
}
