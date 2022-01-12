import { ApiError } from "./ApiError";

export class UnexpectedError extends ApiError {
    constructor(message: string, parentError?: Error) {
        super(message, parentError);

        this.name = "UnexpectedError";
    }
}
