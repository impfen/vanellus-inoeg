// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { Dayjs } from "dayjs";
import type { ProviderBooking } from "./Booking";
import type { PublicProvider } from "./Provider";
import type { Vaccine } from "./Vaccine";

export interface Slot {
    id: string;
    open: boolean;
}

export interface AggregatedPublicAppointment {
    id: string;
    provider: PublicProvider;
    startDate: Dayjs;
    endDate: Dayjs;
    duration: number;
    vaccine: Vaccine;
    properties: Record<string, unknown>;
}

export interface PublicAppointment extends AggregatedPublicAppointment {
    slotData: Slot[];
    publicKey: string;
}

export interface UnpublishedPublicAppointment extends PublicAppointment {
    unpublished: true;
}

export enum AppointmentStatus {
    OPEN = "OPEN",
    BOOKINGS = "BOOKINGS",
    CANCELED = "CANCELED",
    FULL = "FULL",
    UNKNOWN = "UNKNOWN",
}

export interface Appointment extends PublicAppointment {
    bookings: ProviderBooking[];
    status: AppointmentStatus;
    updatedAt: Dayjs;
}
