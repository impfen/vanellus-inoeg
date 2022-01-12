import { PublicAppointment, PublicProvider } from ".";
import { Vaccine } from "./Vaccine";

export interface AppointmentSeries {
    id: string;
    startAt: Date;
    endAt: Date;
    interval: number;
    slotCount: number;
    vaccine: Vaccine;
    provider: PublicProvider;
    appointments: PublicAppointment[];
}
