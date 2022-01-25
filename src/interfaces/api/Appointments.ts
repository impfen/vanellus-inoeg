// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { Slot } from "../Appointment";
import type { PublicProvider } from "../Provider";
import type { ApiEncryptedBooking } from "./Booking";
import type { SignedData } from "./crypto";
import type { ApiSignedProviderData } from "./Provider";

export interface BookedSlot {
    id: string;
}

export interface ApiSignedAppointment extends SignedData {
    bookedSlots: Slot[];
    updatedAt: string;
}

export interface ApiSignedProviderAppointment extends ApiSignedAppointment {
    bookings: ApiEncryptedBooking[];
}

export interface ApiAppointmentKeyChain {
    provider: SignedData;
    mediator: SignedData;
}

export interface ApiProviderAppointments {
    provider: ApiSignedProviderData;
    appointments: ApiSignedAppointment[];
    keyChain: ApiAppointmentKeyChain;
}

export interface ApiAggregatedProviderAppointment {
    provider: PublicProvider;
    appointments: ApiAggregatedAppointment[];
}

export interface ApiProviderProviderAppointments {
    provider: ApiSignedProviderData;
    appointments: ApiSignedProviderAppointment[];
}

export interface ApiAggregatedAppointment {
    id: string;
    timestamp: string;
    duration: number;
    properties: Record<string, unknown>;
    slotN: number;
    vaccine: string;
}

export interface ApiAppointment
    extends Omit<ApiAggregatedAppointment, "slotN"> {
    slotData: Slot[];
    bookedSlots: BookedSlot[];
    publicKey: string;
}
