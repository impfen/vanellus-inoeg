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
