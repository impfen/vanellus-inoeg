export class VanellusError extends Error {
    constructor(message: string, protected readonly parentError?: Error) {
        super(message);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain

        this.name = "VanellusError";
    }
}
