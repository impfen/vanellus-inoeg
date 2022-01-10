import { VanellusError } from "../../errors";

export class ApiError extends VanellusError {
    constructor(
        message = "Api Request",
        protected readonly parentError?: Error
    ) {
        super(message);

        this.name = "TransportError";
    }
}
