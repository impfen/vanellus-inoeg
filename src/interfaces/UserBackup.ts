// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import type { ContactData, QueueData, UserQueueToken } from "./";
import type { Booking } from "./Booking";

export interface UserBackup<Vaccine = string> {
    userQueueToken?: UserQueueToken;
    queueData?: QueueData;
    contactData?: ContactData;
    bookings: Booking<Vaccine>[];
}
