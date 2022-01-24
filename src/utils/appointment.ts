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

export const enrichAppointment = (
    appointmentData: ApiAppointment,
    provider: PublicProvider
) => {
    const appointment: PublicAppointment = {
        id: appointmentData.id,
        provider: provider,
        startDate: dayjs(appointmentData.timestamp),
        endDate: dayjs(appointmentData.timestamp).add(
            appointmentData.duration,
            "minutes"
        ),
        duration: appointmentData.duration,
        properties: appointmentData.properties,
        publicKey: appointmentData.publicKey,
        slotData: appointmentData.slotData.map((slot) => ({
            ...slot,
            open: !appointmentData.bookedSlots?.some(
                (aslot: BookedSlot) => aslot.id === slot.id
            ),
        })),
    };

    return appointment;
};

export const unenrichAppointment = (appointment: PublicAppointment) => {
    console.log("utc", appointment.startDate.utc().toISOString());
    console.log("non", appointment.startDate.toISOString());
    const apiAppointment: ApiAppointment = {
        id: appointment.id,
        timestamp: appointment.startDate.utc().toISOString(),
        duration: appointment.duration,
        properties: appointment.properties,
        publicKey: appointment.publicKey,
        slotData: appointment.slotData,
        bookedSlots: [],
    };

    return apiAppointment;
};
