import { UnexpectedError } from "./UnexpectedError";

export class CryptoError extends UnexpectedError {
    constructor(message = "Cryptographic method failure", parentError?: Error) {
        super(message, parentError);

        this.name = "CryptoError";
    }
}
