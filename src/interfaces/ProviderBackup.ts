import { Backup, Provider } from "../api/interfaces";

export interface ProviderBackup extends Backup {
    verifiedData?: Record<string, unknown>;
    data?: Provider;
}
