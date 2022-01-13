// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

export interface Configurables {
    vaccines: string[];

    /**
     * value in days
     */
    anon_max_time_window: number;

    /**
     * value in days
     */
    anon_aggregated_max_time_window: number;

    /**
     * value in days
     */
    provider_max_time_window: number;
}
