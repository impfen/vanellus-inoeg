import { ApiSettingsData } from "./interfaces";

export interface StorageApiInterface {
    storeSettings: ({
        id,
        data,
    }: {
        id: string;
        data: ApiSettingsData;
    }) => "ok";

    getSettings: ({ id }: { id: string }) => ApiSettingsData;

    deleteSettings: ({ id }: { id: string }) => "ok";

    resetDB: () => "ok";
}
