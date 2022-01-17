// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import destr from "destr";

/**
 * Forces arbitrary JSON to be handled as if it would be a particular, given interface.
 *
 * This is needed as much of the responses of the system are either encrypted or
 * signed json-strings which have to be parsed into objects to be used and are either
 * unknown to the TS-compiler or kind of "freezed" (as the given signature wouldn't match
 * on any change).
 *
 * WARNING: Be aware that, in practice, these typings are basically "hopes" and
 * typescript has no way to guarantee them!
 */
export const parseUntrustedJSON = <T = unknown>(untrusted: string): T => {
    return destr(untrusted) as T;
};
