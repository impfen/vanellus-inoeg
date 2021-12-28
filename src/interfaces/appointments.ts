// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

export interface Booking {
    id: string
}

export interface BookedSlot {
    id: string
}

export interface Slot {
    id: string
    open: boolean
}

export interface AcceptedAppointment {
    appointment: Appointment
    provider: PublicProviderData
    booking: Booking
}

export interface Appointment {
    updatedAt: string
    modified: boolean
    timestamp: string
    duration: number
    properties: { [Key: string]: any }
    id: string
    publicKey: string
    slotData: Slot[]
    bookings?: any[]
}
export interface SignedAppointment {
    data: string
    updatedAt: string
    signature: string
    publicKey: string
    bookedSlots?: BookedSlot[]
    bookings?: Booking[]
    json: Appointment
}

export interface SignedProviderData {
    data: string
    signature: string
    publicKey: string
    id: string
    json?: PublicProviderData
}

export interface PublicProviderData {
    id: string
    name: string
    street: string
    city: string
    zipCode: string
    description: string
}

export interface PublicKeys {
    providerData: string
    tokenKey: string
    rootKey: string
}

export interface KeyChain {
    provider: ActorKey
    mediator: ActorKey
}

export interface ActorKey {
    data: string
    signature: string
    publicKey: string
    json?: ActorKeyData
}

export interface ActorKeyData {
    encryption: string
    signing: string
    data?: { [Key: string]: any }
}

export interface ProviderAppointments {
    provider: SignedProviderData
    appointments: SignedAppointment[]
    keyChain: KeyChain
}

export interface VerifiedProviderAppointments {
    provider: PublicProviderData
    appointments: Appointment[]
}
