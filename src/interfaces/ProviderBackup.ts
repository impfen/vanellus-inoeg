import { Provider } from "../api/interfaces";

export interface ProviderBackup {
    verifiedData?: Record<string, unknown>;
    data?: Provider;
}
