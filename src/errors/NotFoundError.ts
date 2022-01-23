// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { VanellusError } from "./VanellusError";

export class NotFoundError extends VanellusError {
    constructor(message = "Entity not found") {
        super(message);

        this.name = "NotFoundError";
    }
}
