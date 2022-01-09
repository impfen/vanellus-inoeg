export interface Configurables {
    vaccines: string[];

    /**
     * value in days
     */
    anon_max_time_window: number;

    /**
     * value in days
     */
    provider_max_time_window: number;
}
