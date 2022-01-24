// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { Dayjs } from "dayjs";
import type { Appointment, UnpublishedPublicAppointment } from "./Appointment";
import type { PublicProvider } from "./Provider";
import type { Vaccine } from "./Vaccine";

// export enum AppointmentSeriesStatus {
//     UNPUBLISHED = "UNPUBLISHED",
//     OPEN = "OPEN",
//     CANCELED = "CANCELED",
//     UNKNOWN = "UNKNOWN",
// }

interface BaseAppointmentSeries {
    id: string;
    startAt: Dayjs;
    endAt: Dayjs;
    interval: number;
    slotCount: number;
    vaccine: Vaccine;
    provider: PublicProvider;
}

export interface UnpublishedAppointmentSeries extends BaseAppointmentSeries {
    appointments: UnpublishedPublicAppointment[];
}

export interface AppointmentSeries extends BaseAppointmentSeries {
    appointments: Appointment[];
}
