import { parseUntrustedJSON } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { UnexpectedError } from "./errors";
import {
    ApiEncryptedProvider,
    ECDHData,
    MediatorKeyPairs,
    Provider,
    PublicProvider,
    QueueData,
    SignedProvider,
} from "./interfaces";
import { MediatorApiInterface } from "./MediatorApiInterface";
import { ecdhDecrypt, ephemeralECDHEncrypt, sign } from "./utils";

export class MediatorApi extends AbstractApi<
    MediatorApiInterface,
    MediatorKeyPairs
> {
    /**
     * Confirm a given, unverified provider
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
            zipCode: provider.zipCode.toString(),
            website: provider.website,
            description: provider.description,
            accessible: provider.accessible,
        };

        const signedKeyData = await sign(
            JSON.stringify(keyHashesData),
            mediatorKeyPairs.signing.privateKey,
            mediatorKeyPairs.signing.publicKey
        );

        // this will be stored for the provider, so we add the public key data
        const signedProviderData = await sign(
            JSON.stringify(provider),
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

        return provider;
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
        return this.decryptProviderDatas(
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
        return this.decryptProviderDatas(
            await this.transport.call(
                "getVerifiedProviderData",
                { limit },
                mediatorKeyPairs.signing
            ),
            mediatorKeyPairs
        );
    }

    /**
     * Decrypts and parses an array of providerData objects returned by the services
     *
     * @return Promise<Provider[]>
     */
    protected async decryptProviderDatas(
        encryptedProviderDatas: ApiEncryptedProvider[],
        mediatorKeyPairs: MediatorKeyPairs
    ) {
        return Promise.all(
            encryptedProviderDatas.map(({ encryptedData }) =>
                this.decryptProviderData(encryptedData, mediatorKeyPairs)
            )
        );
    }

    /**
     * Decrypts and parses a single providerData object returned by the services
     *
     * @todo verify provider data!
     *
     * @return Promise<Provider>
     */
    protected async decryptProviderData(
        encryptedProviderData: ECDHData,
        mediatorKeyPairs: MediatorKeyPairs
    ) {
        const decryptedProviderDataString = await ecdhDecrypt(
            encryptedProviderData,
            mediatorKeyPairs.provider.privateKey
        );

        return parseUntrustedJSON<Provider>(decryptedProviderDataString);
    }

    protected getQueueDataFromProvider(provider: Provider) {
        const queueData: QueueData = {
            zipCode: provider.zipCode.toString(),
            accessible: provider.accessible,
        };

        return queueData;
    }

    // /**
    //  *
    //  * @param params
    //  * @returns
    //  */
    // protected async getStats(params: any) {
    //     return this.backend.getStats(params)
    // }
}
