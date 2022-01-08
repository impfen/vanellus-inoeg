import { ApiSettingsData } from "./interfaces";

export interface StorageApiInterface {
    storeSettings: (id: string, data: ApiSettingsData) => boolean;
    getSettings: (id: string) => ApiSettingsData;
}
