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

export interface Appointment extends AggregatedAppointment {
    slotData: Slot[];
    publicKey: string;
}

export interface ProviderAppointment extends Omit<Appointment, "provider"> {
    bookings: Booking[];
}
