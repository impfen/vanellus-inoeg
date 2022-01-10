// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Slot } from "../../interfaces";
import { ApiEncryptedBooking } from "./Booking";
import { SignedData } from "./crypto";
import { ApiSignedProviderData } from "./Provider";
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

export interface ApiAppointment {
    id: string;
    timestamp: string;
    duration: number;
    properties: Record<string, unknown>;
    publicKey: string;
    slotData: Slot[];
}
