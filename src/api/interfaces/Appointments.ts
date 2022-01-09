// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { PublicProvider } from "../../interfaces";
import { ECDHData, SignedData } from "./crypto";
import { ApiSignedPublicProvider } from "./Provider";
import { SignedQueueToken, UserToken } from "./QueueData";

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

export interface Appointment {
    id: string;
    timestamp: string;
    duration: number;
    properties: Record<string, unknown>;
    slotData: Slot[];
    bookings?: Booking[];
    updatedAt?: string;
    modified?: boolean;
    publicKey: string;
    provider: PublicProvider;
}

export interface ApiSignedAppointment extends SignedData {
    updatedAt: string;
    bookedSlots?: Slot[];
    bookings?: Booking[];
    json: Appointment;
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

export interface ApiSignedAppointments {
    provider: ApiSignedPublicProvider;
    appointments: ApiSignedAppointment[];
    keyChain: KeyChain;
}
