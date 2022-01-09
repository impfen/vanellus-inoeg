import { Backup, ContactData, QueueData, QueueToken } from "../api/interfaces";
import { Appointment } from "./Appointment";

export interface UserBackup extends Backup {
    tokenData?: QueueToken;
    queueData?: QueueData;
    contactData?: ContactData;
    acceptedAppointments: Appointment[];
}
