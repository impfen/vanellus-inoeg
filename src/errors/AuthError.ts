import { VanellusError } from "./VanellusError";

export class AuthError extends VanellusError {
    constructor(message = "Not authorized", parentError?: Error) {
        super(message, parentError);
        this.name = "AuthError";
    }
}
