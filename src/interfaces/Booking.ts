// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

export enum BookingStatus {
    VALID,
    PROVIDER_CANCELED,
    USER_CANCELED,
    UNKNOWN,
}

export interface Booking {
    slotId: string;
    appointmentId: string;
    providerId: string;
    code: string;
}
