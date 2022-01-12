import { PublicProvider, UnpublishedPublicAppointment } from ".";
import { Vaccine } from "./Vaccine";

export interface UnpublishedAppointmentSeries {
    id: string;
    startAt: Date;
    endAt: Date;
    interval: number;
    slotCount: number;
    vaccine: Vaccine;
    provider: PublicProvider;
    appointments: UnpublishedPublicAppointment[];
}
