import { sign } from "../crypto"
import {
    DecryptedProviderData,
    EncryptedProviderData,
    MediatorKeyPairs,
    ProviderData,
} from "../interfaces"
import { MediatorBackendService } from "./backend/MediatorBackendService"
import { Transport } from "./transports/Transport"
import { ecdhDecrypt, ephemeralECDHEncrypt } from "./utils/crypto/encrypt"
import { parseUntrustedJSON } from "./utils/parseUntrustedJSON"

export class MediatorService {
    constructor(
        protected readonly transport: Transport<MediatorBackendService>
    ) {}

    /**
     * @todo Make parameters more explicit
     *
     * @param param0
     * @param keyPairs
     *
     * @returns
     */
    public async confirmProvider(
        { data, encryptedData }: DecryptedProviderData,
        keyPairs: MediatorKeyPairs
    ) {
        const keyHashesData = {
            signing: data.publicKeys.signing,
            encryption: data.publicKeys.encryption,
            queueData: {
                zipCode: data.zipCode,
                accessible: data.accessible,
            },
        }

        const keysJSONData = JSON.stringify(keyHashesData)

        const publicProviderData = {
            name: data.name,
            street: data.street,
            city: data.city,
            zipCode: data.zipCode,
            website: data.website,
            description: data.description,
            accessible: data.accessible,
        }

        const publicProviderJSONData = JSON.stringify(publicProviderData)

        const signedKeyData = await sign(
            keyPairs.signing.privateKey,
            keysJSONData,
            keyPairs.signing.publicKey
        )

        // this will be stored for the provider, so we add the public key data
        const signedProviderData = await sign(
            keyPairs.signing.privateKey,
            JSON.stringify(data),
            keyPairs.signing.publicKey
        )

        // this will be stored for the general public
        const signedPublicProviderData = await sign(
            keyPairs.signing.privateKey,
            publicProviderJSONData,
            keyPairs.signing.publicKey
        )

        const fullData = {
            signedData: signedProviderData,
            signedPublicData: signedPublicProviderData,
        }

        // we encrypt the data with the public key supplied by the provider
        const [confirmedProviderData] = await ephemeralECDHEncrypt(
            JSON.stringify(fullData),
            encryptedData.publicKey
        )

        const signedConfirmedProviderData = await sign(
            keyPairs.signing.privateKey,
            JSON.stringify(confirmedProviderData),
            keyPairs.signing.publicKey
        )

        return this.transport.call(
            "confirmProvider",
            {
                signedConfirmedProviderData,
                signedPublicProviderData,
                signedKeyData,
            },
            keyPairs.signing
        )
    }

    /**
     *
     */
    public async getPendingProviders(keyPairs: MediatorKeyPairs) {
        const encryptedProviders = await this.transport.call(
            "getPendingProviderData",
            { limit: undefined },
            keyPairs.signing
        )

        return Promise.all(
            encryptedProviders.map((encryptedProviderData) =>
                this.decryptProviderData(
                    encryptedProviderData,
                    keyPairs.provider.privateKey
                )
            )
        )
    }

    /**
     *
     */
    public async getVerifiedProviders(keyPairs: MediatorKeyPairs) {
        const encryptedProviderData = await this.transport.call(
            "getVerifiedProviderData",
            { limit: undefined },
            keyPairs.signing
        )

        return Promise.all(
            encryptedProviderData.map((encryptedProviderData) =>
                this.decryptProviderData(
                    encryptedProviderData,
                    keyPairs.provider.privateKey
                )
            )
        )
    }

    // /**
    //  *
    //  * @param params
    //  * @returns
    //  */
    // protected async getStats(params: any) {
    //     return this.backend.getStats(params)
    // }

    /**
     *
     *
     * @throws if decryption fails
     * @throws if json is invalid
     */
    protected async decryptProviderData(
        encryptedProviderData: EncryptedProviderData,
        privateKey: JsonWebKey
    ) {
        const decryptedProviderDataJson = await ecdhDecrypt(
            encryptedProviderData.encryptedData,
            privateKey
        )

        const providerData = parseUntrustedJSON<ProviderData>(
            decryptedProviderDataJson
        )

        // to do: verify provider data!
        const parsedDecryptedProviderData: DecryptedProviderData = {
            encryptedData: encryptedProviderData.encryptedData,
            data: providerData,
        }

        return parsedDecryptedProviderData
    }
}
