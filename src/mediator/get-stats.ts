// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Mediator } from "./"

// make sure the signing and encryption key pairs exist
export async function getStats(this: Mediator, params: any) {
    try {
        const stats = await this.backend.appointments.getStats(params)

        return {
            status: "loaded",
            data: stats,
        }
    } catch (e) {
        console.error(e)

        return {
            status: "failed",
            error: e,
        }
    }
}
