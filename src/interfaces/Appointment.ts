// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { Dayjs } from "dayjs";
import type { ProviderBooking } from "./Booking";
import type { PublicProvider } from "./Provider";

export interface Slot {
    id: string;
    open: boolean;
}

export interface AggregatedPublicAppointment<Vaccine = string> {
    id: string;
    provider: PublicProvider;
    startAt: Dayjs;
    endAt: Dayjs;
    duration: number;
    vaccine: Vaccine;
    properties: Record<string, unknown>;
}

export interface PublicAppointment<Vaccine = string>
    extends AggregatedPublicAppointment<Vaccine> {
    slotData: Slot[];
    publicKey: string;
}

export interface UnpublishedPublicAppointment<Vaccine = string>
    extends PublicAppointment<Vaccine> {
    unpublished: true;
}

export enum AppointmentStatus {
    OPEN = "OPEN",
    BOOKINGS = "BOOKINGS",
    CANCELED = "CANCELED",
    FULL = "FULL",
    UNKNOWN = "UNKNOWN",
}

export interface Appointment<Vaccine = string>
    extends PublicAppointment<Vaccine> {
    bookings: ProviderBooking<Vaccine>[];
    status: AppointmentStatus;
    updatedAt: Dayjs;
}
