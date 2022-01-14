// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { Booking } from "./Booking";
import type { PublicProvider } from "./Provider";

export interface Slot {
    id: string;
    open: boolean;
}

export interface AggregatedPublicAppointment {
    id: string;
    provider: PublicProvider;
    startDate: Date;
    endDate: Date;
    duration: number;
    properties: Record<string, unknown>;
}

export interface PublicAppointment extends AggregatedPublicAppointment {
    slotData: Slot[];
    publicKey: string;
}

export interface UnpublishedPublicAppointment extends PublicAppointment {
    unpublished: true;
}

export interface Appointment extends PublicAppointment {
    bookings: Booking[];
}
