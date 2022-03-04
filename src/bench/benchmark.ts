#!/usr/bin/env node

import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { TestContext } from "../tests/TestContext";

dayjs.extend(utc);

main();

export async function main() {
    const context = await TestContext.createContext();
    const publicKeys = await context.anonymousApi.getKeys();

    const { provider, providerKeyPairs } =
        await context.createVerifiedProvider();
    const begin = dayjs.utc().add(1, "day").hour(10).minute(0).second(0);

    console.log(dayjs.utc().toISOString() + " START creating appointments");
    for (let delta = 0; delta < 1; delta++) {
        let startAt = begin.add(delta, "day");
        let endAt = startAt.hour(20);
        for (var i = 1; i <= 10; i++) {
            startAt = startAt.second(i);
            endAt = endAt.second(i);
            const appointmentSeries =
                context.providerApi.createAppointmentSeries(
                    startAt,
                    endAt,
                    10,
                    5,
                    "biontech",
                    provider,
                    providerKeyPairs
                );

            await context.providerApi.publishAppointments(
                appointmentSeries.appointments,
                providerKeyPairs
            );
        }
    }
    console.log(dayjs.utc().toISOString() + " END creating appointments");

    console.log(dayjs.utc().toISOString() + " START booking appointments");
    for (var i = 1; i <= 600; i++) {
        if (i % 20 == 0) {
            console.log(
                `${dayjs.utc().toISOString()} ${i * 5} appointments booked`
            );
        }
        const promises = [];
        for (let n = 0; n < 5; n++) {
            promises.push(bookAppointment(context, begin, n));
        }
        await Promise.all(promises);
    }
    console.log(dayjs.utc().toISOString() + " END booking appointments");
}

async function bookAppointment(
    context: TestContext,
    begin: Dayjs,
    off: number
) {
    const aggregatedAppointments =
        await context.anonymousApi.getAggregatedAppointments(
            begin,
            context.defaultProviderData.zipCode
        );

    const pickedAppointment = await context.anonymousApi.getAppointment(
        aggregatedAppointments[off].id,
        aggregatedAppointments[off].provider.id
    );

    const { userQueueToken, userSecret } = await context.createUserQueueToken();

    const booking = await context.userApi.bookAppointment(
        pickedAppointment,
        userQueueToken
    );
}
