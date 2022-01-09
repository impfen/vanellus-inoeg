import { Provider, PublicProvider } from "../interfaces";
import { parseUntrustedJSON } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    ApiEncryptedProviderData,
    ECDHData,
    MediatorKeyPairs,
    SignedProvider,
} from "./interfaces";
import { MediatorApiInterface } from "./MediatorApiInterface";
import { ecdhDecrypt, ephemeralECDHEncrypt, sign } from "./utils";

export class MediatorApi extends AbstractApi<
    AnonymousApiInterface & MediatorApiInterface,
    MediatorKeyPairs
> {
    /**
     * Confirm a given, unconfirmed provider
     *
     * @return Promise<Provider>
     */
    public async confirmProvider(
        providerData: Provider,
        mediatorKeyPairs: MediatorKeyPairs
    ) {
        const keyHashesData = {
            signing: providerData.publicKeys.signing,
            encryption: providerData.publicKeys.encryption,
            queueData: {
                zipCode: providerData.zipCode,
                accessible: providerData.accessible,
            },
        };

        const publicProvider: PublicProvider = {
            id: providerData.id,
            name: providerData.name,
            street: providerData.street,
            city: providerData.city,
            zipCode: providerData.zipCode,
            website: providerData.website,
            description: providerData.description,
            accessible: providerData.accessible,
        };

        const signedKeyData = await sign(
            JSON.stringify(keyHashesData),
            mediatorKeyPairs.signing.privateKey,
            mediatorKeyPairs.signing.publicKey
        );

        // this will be stored for the provider, so we add the public key data
        const signedProviderData = await sign(
            JSON.stringify(providerData),
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
        const [confirmedProviderData] = await ephemeralECDHEncrypt(
            JSON.stringify(providerSignedData),
            providerData.publicKeys.data
        );

        const signedConfirmedProviderData = await sign(
            JSON.stringify(confirmedProviderData),
            mediatorKeyPairs.signing.privateKey,
            mediatorKeyPairs.signing.publicKey
        );

        await this.transport.call(
            "confirmProvider",
            {
                confirmedProviderData: signedConfirmedProviderData,
                publicProviderData: signedPublicProviderData,
                signedKeyData: signedKeyData,
            },
            mediatorKeyPairs.signing
        );

        return providerData;
    }

    /**
     * Returns the decrypted list of all pending providers
     *
     * A provider is pending until it is confirmed by a mediator.
     *
     * @return Promise<Provider[]>
     */
    public async getPendingProviders(mediatorKeyPairs: MediatorKeyPairs) {
        return this.decryptProviderDatas(
            await this.transport.call(
                "getPendingProviderData",
                { limit: undefined },
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
    public async getVerifiedProviders(mediatorKeyPairs: MediatorKeyPairs) {
        return this.decryptProviderDatas(
            await this.transport.call(
                "getVerifiedProviderData",
                { limit: undefined },
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
        encryptedProviderDatas: Omit<ApiEncryptedProviderData, "id">[],
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

        const providerData = parseUntrustedJSON<Omit<Provider, "id">>(
            decryptedProviderDataString
        );

        return providerData;
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
