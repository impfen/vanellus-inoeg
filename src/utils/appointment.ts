// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import dayjs from "dayjs";
import type {
    ApiAppointment,
    BookedSlot,
    PublicAppointment,
    PublicProvider,
} from "../interfaces";

export const enrichAppointment = <Vaccine = string>(
    appointmentData: ApiAppointment,
    provider: PublicProvider
) => {
    const appointment: PublicAppointment<Vaccine> = {
        id: appointmentData.id,
        provider: provider,
        startAt: dayjs.utc(appointmentData.timestamp),
        endAt: dayjs
            .utc(appointmentData.timestamp)
            .add(appointmentData.duration, "minutes"),
        duration: appointmentData.duration,
        properties: appointmentData.properties,
        publicKey: appointmentData.publicKey,
        slotData: appointmentData.slotData.map((slot) => ({
            ...slot,
            open: !appointmentData.bookedSlots?.some(
                (aslot: BookedSlot) => aslot.id === slot.id
            ),
        })),
        vaccine: appointmentData.vaccine as unknown as Vaccine,
    };

    return appointment;
};

export const unenrichAppointment = <Vaccine = string>(
    appointment: PublicAppointment<Vaccine>
) => {
    const apiAppointment: ApiAppointment = {
        id: appointment.id,
        timestamp: appointment.startAt.utc().toISOString(),
        duration: appointment.duration,
        properties: appointment.properties,
        publicKey: appointment.publicKey,
        slotData: appointment.slotData,
        vaccine: appointment.vaccine as unknown as string,
        bookedSlots: [],
    };

    return apiAppointment;
};
