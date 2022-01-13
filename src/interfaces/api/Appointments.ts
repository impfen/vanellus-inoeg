// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { PublicProvider, Slot } from "..";
import { ApiEncryptedBooking } from "./Booking";
import { SignedData } from "./crypto";
import { ApiSignedProviderData } from "./Provider";

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
}

export interface ApiAppointment
    extends Omit<ApiAggregatedAppointment, "slotN"> {
    slotData: Slot[];
    bookedSlots: BookedSlot[];
    publicKey: string;
}
