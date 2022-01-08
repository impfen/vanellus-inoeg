// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import {
    ApiSignedPublicProvider,
    PublicProviderData,
    SignedQueueToken,
} from ".";
import { ECDHData, SignedData } from "./crypto";
import { UserToken } from "./user";

export interface BookingData {
    userToken: UserToken;
    signedToken: SignedQueueToken;
}

export interface Booking {
    id: string;
    publicKey: string;
    token: string;
    encryptedData: ECDHData;
    data?: BookingData;
}

export interface Slot {
    id: string;
    open?: boolean;
}
export interface UnpublishedAppointment {
    id: string;
    timestamp: string;
    duration: number;
    properties: Record<string, unknown>;
    slotData: Slot[];
    bookings?: Booking[];
    updatedAt?: string;
    modified?: boolean;
}

export interface Appointment extends UnpublishedAppointment {
    publicKey: string;
}

export interface ApiSignedAppointment extends SignedData {
    updatedAt: string;
    bookedSlots?: Slot[];
    bookings?: Booking[];
    json: Appointment;
}

export interface PublicKeys {
    providerData: string;
    tokenKey: string;
    rootKey: string;
}

export interface KeyChain {
    provider: ActorKey;
    mediator: ActorKey;
}

export interface ActorKey extends SignedData {
    json?: ActorKeyData;
}

export interface ActorKeyData {
    encryption: string;
    signing: string;
    data?: Record<string, unknown>;
}

export interface ApiProviderAppointments {
    provider: PublicProviderData;
    appointments: Appointment[];
}

export interface ApiSignedProviderAppointments {
    provider: ApiSignedPublicProvider;
    appointments: ApiSignedAppointment[];
    keyChain: KeyChain;
}
