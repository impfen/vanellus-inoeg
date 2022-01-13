// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { ApiError } from "./ApiError";

export class UnexpectedError extends ApiError {
    constructor(message: string, parentError?: Error) {
        super(message, parentError);

        this.name = "UnexpectedError";
    }
}
