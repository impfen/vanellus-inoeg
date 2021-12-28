// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Backend } from "../../backend"
import { AdminKeys } from "./"

export async function resetDB(backend: Backend, adminKeys: AdminKeys) {
    await backend.appointments.resetDB({}, adminKeys.root)
    await backend.storage.resetDB({}, adminKeys.root)
}
