import { ContactData, QueueData, UserQueueToken } from "./";
import { Appointment } from "./Appointment";

export interface UserBackup {
    userQueueToken?: UserQueueToken;
    queueData?: QueueData;
    contactData?: ContactData;
    acceptedAppointments: Appointment[];
}
