import { dayjs } from "../utils";
import { AbstractApi } from "./AbstractApi";
import { AnonymousApiInterface } from "./AnonymousApiInterface";
import {
    Appointment,
    ContactData,
    PublicProviderData,
    UserKeyPairs,
    UserTokenData,
} from "./interfaces";
import { UserApiInterface } from "./UserApiInterface";
import {
    b642buf,
    buf2base32,
    ephemeralECDHEncrypt,
    generateECDHKeyPair,
    generateECDSAKeyPair,
    hash,
    randomBytes,
} from "./utils";

export class UserApi extends AbstractApi<
    AnonymousApiInterface & UserApiInterface,
    UserKeyPairs
> {
    public async cancelAppointment(
        appointment: Appointment,
        provider: PublicProviderData,
        tokenData: UserTokenData
    ) {
        return this.transport.call(
            "cancelAppointment",
            {
                id: appointment.id,
                providerID: provider.id,
                signedTokenData: tokenData.signedToken,
            },
            tokenData.keyPairs.signing
        );
    }

    public generateSecret() {
        return buf2base32(b642buf(randomBytes(10)));
    }

    public async generateKeyPairs() {
        const signingKeyPair = await generateECDSAKeyPair();
        const encryptionKeyPair = await generateECDHKeyPair();

        const keyPairs = {
            signing: signingKeyPair,
            encryption: encryptionKeyPair,
        };

        return keyPairs;
    }

    public async bookAppointment(
        appointment: Appointment,
        provider: PublicProviderData,
        tokenData: UserTokenData
    ) {
        const providerData = {
            signedToken: tokenData.signedToken,
            userToken: tokenData.userToken,
        };

        const encryptedDataAndPublicKey = await ephemeralECDHEncrypt(
            JSON.stringify(providerData),
            appointment.publicKey
        );

        // we don't care about the ephmeral key
        const [encryptedData] = encryptedDataAndPublicKey;

        const booking = await this.transport.call(
            "bookAppointment",
            {
                id: appointment.id,
                providerID: provider.id,
                encryptedData: encryptedData,
                signedTokenData: tokenData.signedToken,
            },
            tokenData.keyPairs.signing
        );

        // we store the information about the offer which we've accepted
        return booking;
    }

    // get a token for a given queue
    public async getToken(
        contactData: ContactData,
        secret: string,
        code?: string
    ) {
        // we hash the user data to prove it didn't change later...
        const [dataHash, nonce] = await this.hashContactData(contactData);
        const signingKeyPair = await generateECDSAKeyPair();
        const encryptionKeyPair = await generateECDHKeyPair();

        const userToken = {
            version: "0.3",
            code: secret.slice(0, 4),
            createdAt: dayjs().utc().toISOString(),
            publicKey: signingKeyPair.publicKey, // the signing key to control the ID
            encryptionPublicKey: encryptionKeyPair.publicKey,
        };

        const signedToken = await this.transport.call("getToken", {
            hash: dataHash,
            publicKey: signingKeyPair.publicKey,
            code: code,
        });

        return {
            createdAt: dayjs().utc().toISOString(),
            signedToken: signedToken,
            keyPairs: {
                signing: signingKeyPair,
                encryption: encryptionKeyPair,
            },
            hashNonce: nonce,
            dataHash: dataHash,
            userToken: userToken,
        };
    }

    protected async hashContactData(data: ContactData) {
        const hashData = {
            name: data.name,
            nonce: randomBytes(32),
        };

        const hashDataJSON = JSON.stringify(hashData);
        const dataHash = await hash(hashDataJSON);

        return [dataHash, hashData.nonce];
    }
}
