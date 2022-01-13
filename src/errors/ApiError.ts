// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { VanellusError } from "./VanellusError";

export class ApiError extends VanellusError {
    constructor(
        message = "Api Request",
        protected readonly parentError?: Error
    ) {
        super(message);

        this.name = "TransportError";
    }
}
