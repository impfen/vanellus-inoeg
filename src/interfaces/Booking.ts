// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

export enum BookingStatus {
    VALID = "VALID",
    PROVIDER_CANCELED = "PROVIDER_CANCELED",
    USER_CANCELED = "USER_CANCELED",
    UNKNOWN = "UNKNOWN",
}

export interface Booking {
    slotId: string;
    appointmentId: string;
    providerId: string;
    code: string;
}
