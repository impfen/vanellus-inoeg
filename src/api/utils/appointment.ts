import { VanellusError } from "../../errors";
import { dayjs } from "../../utils/dayjs";
import {
    Appointment,
    ProviderKeyPairs,
    PublicProvider,
    Slot,
} from "../interfaces";
import { randomBytes } from "./random";

export const enrichAppointment = (appointmentData: Appointment) => {
    const appointment: Appointment = {
        id: appointmentData.id,
        provider: appointmentData.provider,
        startDate: dayjs(appointmentData.startDate).utc().toDate(),
        endDate: dayjs(appointmentData.startDate)
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

export const createAppointmentSet = (
    startAt: Date,
    endAt: Date,
    interval: number,
    lanes: number,
    vaccine: string,
    provider: PublicProvider,
    providerKeyPairs: ProviderKeyPairs
) => {
    if (startAt > endAt) {
        throw new VanellusError("Can't start set before it's end.");
    }

    if (startAt == endAt) {
        throw new VanellusError("Start and end can't be equal.");
    }

    let startDayjs = dayjs(startAt);
    const endDayjs = dayjs(endAt);
    const appointments: Appointment[] = [];

    do {
        appointments.push(
            createAppointment(
                startDayjs.toDate(),
                interval,
                lanes,
                vaccine,
                provider,
                providerKeyPairs
            )
        );

        startDayjs = startDayjs.add(interval, "minute");
    } while (startDayjs < endDayjs);

    return appointments;
};

export const createAppointment = (
    startDate: Date,
    duration: number,
    slotCount: number,
    vaccine: string,
    provider: PublicProvider,
    providerKeyPairs: ProviderKeyPairs,
    properties: Record<string, unknown> = {}
) => {
    const appointment: Appointment = {
        id: randomBytes(32),
        startDate: dayjs(startDate).utc().toDate(),
        endDate: dayjs(startDate).utc().add(duration, "minutes").toDate(),
        duration: duration,
        properties: { ...properties, vaccine: vaccine },
        slotData: createSlots(slotCount),
        publicKey: providerKeyPairs.encryption.publicKey,
        provider,
    };

    return appointment;
};

export const createSlots = (count: number) => {
    const slotData: Slot[] = [];

    for (let i = 0; i < count; i++) {
        slotData[i] = {
            id: randomBytes(32),
            open: true,
        };
    }

    return slotData;
};
