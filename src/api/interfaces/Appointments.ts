// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { Slot } from "../../interfaces";
import { ApiEncryptedBooking } from "./Booking";
import { SignedData } from "./crypto";
import { ApiSignedPublicProvider } from "./Provider";
export interface ApiSignedAppointment extends SignedData {
    updatedAt: string;
    bookedSlots?: Slot[];
    bookings: ApiEncryptedBooking[];
}

export interface ApiAppointmentKeyChain {
    provider: SignedData;
    mediator: SignedData;
}

export interface ApiSignedAppointments {
    provider: ApiSignedPublicProvider;
    appointments: ApiSignedAppointment[];
    keyChain: ApiAppointmentKeyChain;
}
