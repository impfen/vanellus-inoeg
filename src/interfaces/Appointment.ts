import { Booking } from "./Booking";
import { PublicProvider } from "./Provider";

export interface Slot {
    id: string;
    open?: boolean;
}

export interface Appointment {
    id: string;
    timestamp: Date;
    duration: number;
    properties: Record<string, unknown>;
    slotData: Slot[];
    bookings?: Booking[];
    // modified?: boolean;
    publicKey: string;
    provider: PublicProvider;
    updatedAt?: string;
}
