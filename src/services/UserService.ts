import {
    AcceptedAppointment,
    Appointment,
    ContactData,
    PublicProviderData,
    TokenData,
} from ".."
import {
    ephemeralECDHEncrypt,
    generateECDHKeyPair,
    generateECDSAKeyPair,
    hashString,
    randomBytes,
} from "../crypto"
import { UserBackendService } from "./backend/UserBackendService"
import { Transport } from "./transports/Transport"

export class UserService {
    constructor(protected readonly transport: Transport<UserBackendService>) {}

    public async cancelAppointment(
        acceptedAppointment: AcceptedAppointment,
        tokenData: TokenData
    ) {
        return this.transport.call(
            "cancelAppointment",
            {
                id: acceptedAppointment.appointment.id,
                signedTokenData: tokenData.signedToken,
                providerID: acceptedAppointment.provider.id,
            },
            tokenData.keyPairs.signing
        )
    }

    public async bookAppointment(
        appointment: Appointment,
        provider: PublicProviderData,
        tokenData: TokenData
    ) {
        const providerData = {
            signedToken: tokenData.signedToken,
            userToken: tokenData.userToken,
        }

        const encryptedDataAndPublicKey = await ephemeralECDHEncrypt(
            JSON.stringify(providerData),
            appointment.publicKey
        )

        // we don't care about the ephmeral key
        const [encryptedData] = encryptedDataAndPublicKey

        const response = await this.transport.call(
            "bookAppointment",
            {
                id: appointment.id,
                providerID: provider.id,
                encryptedData: encryptedData,
                signedTokenData: tokenData.signedToken,
            },
            tokenData.keyPairs.signing
        )

        const acceptedAppointment: AcceptedAppointment = {
            appointment: appointment,
            provider: provider,
            booking: response,
        }

        // we store the information about the offer which we've accepted
        return acceptedAppointment
    }

    // get a token for a given queue
    public async getToken(
        contactData: ContactData,
        secret: string,
        code?: string
    ) {
        // we hash the user data to prove it didn't change later...
        const [dataHash, nonce] = await this.hashContactData(contactData)
        const signingKeyPair = await generateECDSAKeyPair()
        const encryptionKeyPair = await generateECDHKeyPair()

        const userToken = {
            version: "0.3",
            code: secret.slice(0, 4),
            createdAt: new Date().toISOString(),
            publicKey: signingKeyPair.publicKey, // the signing key to control the ID
            encryptionPublicKey: encryptionKeyPair.publicKey,
        }

        const signedToken = await this.transport.call("getToken", {
            hash: dataHash,
            publicKey: signingKeyPair.publicKey,
            code: code,
        })

        return {
            createdAt: new Date().toISOString(),
            signedToken: signedToken,
            keyPairs: {
                signing: signingKeyPair,
                encryption: encryptionKeyPair,
            },
            hashNonce: nonce,
            dataHash: dataHash,
            userToken: userToken,
        }
    }

    protected async hashContactData(data: ContactData) {
        const hashData = {
            name: data.name,
            nonce: randomBytes(32),
        }

        const hashDataJSON = JSON.stringify(hashData)
        const dataHash = await hashString(hashDataJSON)

        return [dataHash, hashData.nonce]
    }
}
