// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

/**
 * This utility forces arbitrary json to be handled as if it would be a particular,
 * given interface in typescript.
 *
 * This is needed as much of the responses of the system are either encrypted or
 * signed json-strings which have to be "decompressed" to be used and are either
 * unknown or kind of "freezed" (as the given signature wouldn't match otherwise).
 *
 * WARNING: Be aware that, in practice, these typings are basically "hopes" and
 * typescript has no way to guarantee them at runtime!
 */
export const parseUntrustedJSON = <T = unknown>(untrusted: string): T => {
    return JSON.parse(untrusted) as T;
};
