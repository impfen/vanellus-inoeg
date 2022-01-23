// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import {
    AggregatedPublicAppointment,
    SignedData,
    UserKeyPairs,
    UserToken,
} from ".";

export enum BookingStatus {
    VALID = "VALID",
    PROVIDER_CANCELED = "PROVIDER_CANCELED",
    USER_CANCELED = "USER_CANCELED",
    UNKNOWN = "UNKNOWN",
}

export interface ProviderBooking {
    slotId: string;
    appointment: AggregatedPublicAppointment;
    token: UserToken;
    signedToken: SignedData;
}

export interface Booking extends ProviderBooking {
    keyPairs: UserKeyPairs;
}
