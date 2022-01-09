import { PublicProvider } from "../interfaces";
import { parseUntrustedJSON } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    ApiEncryptedProviderData,
    ECDHData,
    MediatorKeyPairs,
    ProviderData,
    ProviderSignedData,
} from "./interfaces";
import { MediatorApiInterface } from "./MediatorApiInterface";
import { ecdhDecrypt, ephemeralECDHEncrypt, sign } from "./utils";

export class MediatorApi extends AbstractApi<
    AnonymousApiInterface & MediatorApiInterface,
    MediatorKeyPairs
> {
    /**
     * @todo Make parameters more explicit
     *
     * @param param0
     * @param keyPairs
     *
     * @returns
     */
    public async confirmProvider(
        providerData: ProviderData,
        mediatorKeyPairs: MediatorKeyPairs
    ) {
        const providerPublicKeys = providerData.publicKeys;

        const keyHashesData = {
            signing: providerPublicKeys.signing,
            encryption: providerPublicKeys.encryption,
            queueData: {
                zipCode: providerData.zipCode,
                accessible: providerData.accessible,
            },
        };

        const keysJSONData = JSON.stringify(keyHashesData);

        const publicProvider: PublicProvider = {
            name: providerData.name,
            street: providerData.street,
            city: providerData.city,
            zipCode: providerData.zipCode,
            website: providerData.website,
            description: providerData.description,
            accessible: providerData.accessible,
        };

        const publicProviderJSONData = JSON.stringify(publicProvider);

        const signedKeyData = await sign(
            keysJSONData,
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
            publicProviderJSONData,
            mediatorKeyPairs.signing.privateKey,
            mediatorKeyPairs.signing.publicKey
        );

        const fullData: ProviderSignedData = {
            signedData: signedProviderData,
            signedPublicData: signedPublicProviderData,
        };

        // we encrypt the data with the public key supplied by the provider
        const [confirmedProviderData] = await ephemeralECDHEncrypt(
            JSON.stringify(fullData),
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
     *
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
     *
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

    protected async decryptProviderDatas(
        encryptedProviderDatas: ApiEncryptedProviderData[],
        mediatorKeyPairs: MediatorKeyPairs
    ) {
        return Promise.all(
            encryptedProviderDatas.map(({ encryptedData }) =>
                this.decryptProviderData(encryptedData, mediatorKeyPairs)
            )
        );
    }

    /**
     * @todo verify provider data!
     *
     * @throws if decryption fails
     * @throws if json is invalid
     */
    protected async decryptProviderData(
        encryptedProviderData: ECDHData,
        mediatorKeyPairs: MediatorKeyPairs
    ) {
        const decryptedProviderDataString = await ecdhDecrypt(
            encryptedProviderData,
            mediatorKeyPairs.provider.privateKey
        );

        const providerData = parseUntrustedJSON<ProviderData>(
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
