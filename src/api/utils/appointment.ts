import { dayjs } from "../../utils/dayjs";
import { ApiAppointment, Appointment, PublicProvider } from "../interfaces";

export const enrichAppointment = (
    appointmentData: ApiAppointment,
    provider: PublicProvider
) => {
    const appointment: Appointment = {
        id: appointmentData.id,
        provider: provider,
        startDate: dayjs(appointmentData.timestamp).utc().toDate(),
        endDate: dayjs(appointmentData.timestamp)
            .utc()
            .add(appointmentData.duration, "minutes")
            .toDate(),
        duration: appointmentData.duration,
        properties: appointmentData.properties,
        publicKey: appointmentData.publicKey,
        slotData: appointmentData.slotData,
    };

    return appointment;
};

export const unenrichAppointment = (appointment: Appointment) => {
    const apiAppointment: ApiAppointment = {
        id: appointment.id,
        timestamp: dayjs(appointment.startDate).utc().toISOString(),
        duration: appointment.duration,
        properties: appointment.properties,
        publicKey: appointment.publicKey,
        slotData: appointment.slotData,
    };

    return apiAppointment;
};
