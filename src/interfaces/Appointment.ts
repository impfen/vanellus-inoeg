import { Booking } from "./Booking";
import { PublicProvider } from "./Provider";

export interface Slot {
    id: string;
    open?: boolean;
}

export interface Appointment {
    id: string;
    provider: PublicProvider;
    startDate: Date;
    endDate: Date;
    duration: number;
    properties: Record<string, unknown>;
    slotData: Slot[];
    publicKey: string;
}

export interface ProviderAppointment extends Appointment {
    bookings?: Booking[];
}
