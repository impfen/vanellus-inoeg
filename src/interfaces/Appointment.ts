import { Booking } from "./Booking";
import { PublicProvider } from "./Provider";

export interface Slot {
    id: string;
    open: boolean;
}

export interface AggregatedAppointment {
    id: string;
    provider: PublicProvider;
    startDate: Date;
    endDate: Date;
    duration: number;
    properties: Record<string, unknown>;
}

export interface PublicAppointment extends AggregatedAppointment {
    slotData: Slot[];
    publicKey: string;
}

export interface Appointment extends PublicAppointment {
    bookings: Booking[];
}
