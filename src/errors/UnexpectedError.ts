import { VanellusError } from "./VanellusError";

export class UnexpectedError extends VanellusError {
    constructor(message: string, parentError?: Error) {
        super(message, parentError);

        this.name = "UnexpectedError";
    }
}
