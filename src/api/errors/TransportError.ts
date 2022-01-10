import { VanellusError } from "../../errors";

export class TransportError extends VanellusError {
    constructor(
        message = "Bad Request",
        public readonly code?: number,
        protected readonly parentError?: Error
    ) {
        super(message);

        this.name = "TransportError";
    }
}
