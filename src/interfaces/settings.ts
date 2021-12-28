// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

export interface AppointmentSettings {
    properties: { [Key: string]: any }
}

export interface ApiUrls {
    appointments: string
    storage: string
}

export interface Settings {
    apiUrls: ApiUrls
    appointment: AppointmentSettings
}
