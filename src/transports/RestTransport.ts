// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* @todo needs some love... but too much other stuff to do first... */

import { TransportError } from "../errors";
import type { KeyPair } from "../interfaces";
import { AbstractTransport } from "./AbstractTransport";
import { MethodParamsIfExists } from "./Transport";

const methodData: Record<
    any,
    {
        uri: string | ((p: any) => string);
        method: "POST" | "GET" | "DELETE" | "PUT";
    }
> = {
    addMediatorPublicKeys: {
        uri: "mediators",
        method: "POST",
    },
    bookAppointment: {
        uri: "appointments/book",
        method: "POST",
    },
    cancelAppointment: {
        uri: "appointments/cancel",
        method: "DELETE",
    },
    checkProviderData: {
        uri: "providers/data/check",
        method: "POST",
    },
    confirmProvider: {
        uri: "providers",
        method: "POST",
    },
    getAppointment: {
        uri: (p) =>
            ["provider", p.providerID, "appointments", p.id]
                .map(encodeURIComponent)
                .join("/"),
        method: "GET",
    },
    getAppointmentsByZipCode: {
        uri: (p) =>
            ["appointments", "zipCode", p.zipCode, p.radius, p.from, p.to]
                .map(encodeURIComponent)
                .join("/"),
        method: "GET",
    },
    getKeys: { uri: "keys", method: "GET" },
    getPendingProviderData: {
        uri: "providers/pending",
        method: "POST",
    },
    getProvidersByZipCode: {
        uri: (p) =>
            ["providers", "zipCode", p.zipFrom, p.zipTo]
                .map(encodeURIComponent)
                .join("/"),
        method: "GET",
    },
    getProviderAppointments: {
        uri: "appointments",
        method: "POST",
    },
    getProviderAppointmentsByProperty: {
        uri: "appointments/property",
        method: "POST",
    },
    getSettings: {
        uri: (p) =>
            `store/${encodeURIComponent(p.id as string | number | boolean)}`,
        method: "GET",
    },
    getStats: { uri: "stats", method: "GET" },
    getToken: { uri: "token", method: "POST" },
    getVerifiedProviderData: {
        uri: "providers/verified",
        method: "POST",
    },
    publishAppointments: {
        uri: "appointments/publish",
        method: "POST",
    },
    resetDB: {
        uri: "db/reset",
        method: "DELETE",
    },
    isValidMediator: {
        uri: "mediator/isValid",
        method: "POST",
    },
    isValidProvider: {
        uri: "provider/isValid",
        method: "POST",
    },
    storeProviderData: {
        uri: "providers/data",
        method: "POST",
    },
    storeSettings: {
        uri: "store",
        method: "PUT",
    },
};

export class RestTransport<TMethods = any> extends AbstractTransport<TMethods> {
    protected getMethodData<K extends keyof TMethods>(k: K) {
        return methodData[k];
    }

    public async call<K extends keyof TMethods>(
        method: K,
        params?: MethodParamsIfExists<TMethods, K>,
        keyPair?: KeyPair
    ) {
        const methodParams = this.getMethodData(method);
        const callParams =
            typeof keyPair === "object"
                ? await this.signParams(params, keyPair)
                : params;

        const uri =
            this.apiUrl +
            (typeof methodParams.uri === "function"
                ? methodParams.uri(params)
                : methodParams.uri);

        let response;

        if (methodParams.method === "GET") {
            response = await fetch(uri, {
                method: "GET",
                headers: {
                    ["content-type"]: "application/json",
                },
            });
        } else {
            response = await fetch(uri, {
                method: methodParams.method,
                headers: {
                    ["content-type"]: "application/json",
                },
                body: JSON.stringify(callParams),
            });
        }

        if (!response.ok) {
            throw new TransportError(response.statusText, response.status);
        }

        return response.json();
    }
}
