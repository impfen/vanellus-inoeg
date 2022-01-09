import { BackupData, Provider } from "../api/interfaces";

export interface ProviderBackup extends BackupData {
    verifiedData?: Record<string, unknown>;
    data?: Provider;
}
