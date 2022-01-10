import { parseUntrustedJSON } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import { ApiError } from "./errors";
import {
    ApiEncryptedProvider,
    ECDHData,
    MediatorKeyPairs,
    Provider,
    PublicProvider,
    SignedProvider,
} from "./interfaces";
import { MediatorApiInterface } from "./MediatorApiInterface";
import { ecdhDecrypt, ephemeralECDHEncrypt, sign } from "./utils";

export class MediatorApi extends AbstractApi<
    AnonymousApiInterface & MediatorApiInterface,
    MediatorKeyPairs
> {
    /**
     * Verify a given, unverified provider
     *
     * @return Promise<Provider>
     */
    public async verifyProvider(
        provider: Provider,
        mediatorKeyPairs: MediatorKeyPairs
    ) {
        const keyHashesData = {
            signing: provider.publicKeys.signing,
            encryption: provider.publicKeys.encryption,
            queueData: {
                zipCode: provider.zipCode,
                accessible: provider.accessible,
            },
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
        const [verifiedProviderData] = await ephemeralECDHEncrypt(
            JSON.stringify(providerSignedData),
            provider.publicKeys.data
        );

        const signedVerifiedProviderData = await sign(
            JSON.stringify(verifiedProviderData),
            mediatorKeyPairs.signing.privateKey,
            mediatorKeyPairs.signing.publicKey
        );

        const result = await this.transport.call(
            "confirmProvider",
            {
                confirmedProviderData: signedVerifiedProviderData,
                publicProviderData: signedPublicProviderData,
                signedKeyData: signedKeyData,
            },
            mediatorKeyPairs.signing
        );

        if ("ok" !== result) {
            throw new ApiError(`Could not verify provider ${provider.id}`);
        }

        return provider;
    }

    /**
     * Returns the decrypted list of all pending providers
     *
     * A provider is pending until it is confirmed by a mediator.
     *
     * @return Promise<Provider[]>
     */
    public async getUnverifiedProviders(
        mediatorKeyPairs: MediatorKeyPairs,
        limit?: number
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
     * @return Promise<Provider[]>
     */
    public async getVerifiedProviders(
        mediatorKeyPairs: MediatorKeyPairs,
        limit?: number
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

    // /**
    //  *
    //  * @param params
    //  * @returns
    //  */
    // protected async getStats(params: any) {
    //     return this.backend.getStats(params)
    // }
}
