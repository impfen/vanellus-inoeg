import { VanellusError } from "./VanellusError";

export class BackendError extends VanellusError {
    public readonly data: {
        error: string;
        data?: string;
    };

    constructor(data: { error: string; data?: string }) {
        super("Backend Error");
        this.name = "BackendError";
        this.data = data;
    }
}
