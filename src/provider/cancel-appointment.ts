// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { VanellusError } from "../errors"
import { Appointment, Result } from "../interfaces"
import { Provider } from "./"

/**
 * Cancles an appointment by emptying the slots of the appointment and uploading
 * to server
 * @param appointment The appointment to be cancled
 */

export async function cancelAppointment(
    this: Provider,
    appointment: Appointment
): Promise<Result | VanellusError> {
    appointment.slotData = []
    const result = await this.publishAppointments([appointment])

    return result
}
