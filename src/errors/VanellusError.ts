// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

export class VanellusError extends Error {
    constructor(message: string, protected readonly parentError?: Error) {
        super(message);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain

        this.name = "VanellusError";
    }
}
