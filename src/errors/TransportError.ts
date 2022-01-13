// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ApiError } from "./ApiError";

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
