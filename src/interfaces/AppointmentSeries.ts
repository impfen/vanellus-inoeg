// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { Dayjs } from "dayjs";
import type { Appointment, UnpublishedPublicAppointment } from "./Appointment";
import type { PublicProvider } from "./Provider";

// export enum AppointmentSeriesStatus {
//     UNPUBLISHED = "UNPUBLISHED",
//     OPEN = "OPEN",
//     CANCELED = "CANCELED",
//     UNKNOWN = "UNKNOWN",
// }

interface BaseAppointmentSeries<Vaccine = string> {
    id: string;
    startAt: Dayjs;
    endAt: Dayjs;
    interval: number;
    slotCount: number;
    vaccine: Vaccine;
    provider: PublicProvider;
}

export interface UnpublishedAppointmentSeries<Vaccine = string>
    extends BaseAppointmentSeries<Vaccine> {
    appointments: UnpublishedPublicAppointment<Vaccine>[];
}

export interface AppointmentSeries<Vaccine = string>
    extends BaseAppointmentSeries<Vaccine> {
    appointments: Appointment<Vaccine>[];
}
