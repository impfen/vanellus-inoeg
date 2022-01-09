import {
    BackupData,
    ContactData,
    QueueData,
    QueueToken,
} from "../api/interfaces";
import { Appointment } from "./Appointment";

export interface UserBackupData extends BackupData {
    tokenData?: QueueToken;
    queueData?: QueueData;
    contactData?: ContactData;
    acceptedAppointments: Appointment[];
}
