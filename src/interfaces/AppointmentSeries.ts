// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { PublicProvider, UnpublishedPublicAppointment } from ".";
import type { Vaccine } from "./Vaccine";

export interface UnpublishedAppointmentSeries {
    id: string;
    startAt: Date;
    endAt: Date;
    interval: number;
    slotCount: number;
    vaccine: Vaccine;
    provider: PublicProvider;
    appointments: UnpublishedPublicAppointment[];
}
