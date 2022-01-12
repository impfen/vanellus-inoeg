import { ContactData, QueueData, UserQueueToken } from "./";
import { Booking } from "./Booking";

export interface UserBackup {
    userQueueToken?: UserQueueToken;
    queueData?: QueueData;
    contactData?: ContactData;
    bookings: Booking[];
}
