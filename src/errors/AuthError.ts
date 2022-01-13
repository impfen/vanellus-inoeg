// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { VanellusError } from "./VanellusError";

export class AuthError extends VanellusError {
    constructor(message = "Not authorized", parentError?: Error) {
        super(message, parentError);
        this.name = "AuthError";
    }
}
