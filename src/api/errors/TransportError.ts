import { ApiError } from ".";

export class TransportError extends ApiError {
    constructor(
        message = "Bad Request",
        public readonly code?: number,
        protected readonly parentError?: Error
    ) {
        super(message);

        this.name = "TransportError";
    }
}
