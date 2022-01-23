// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import { decodeBase64url, encodeBase64url } from "../../utils/base64url";

describe("base64url", () => {
    it("encodeBase64url", () => {
        const base64url = encodeBase64url("This is my testbuffer");

        expect(base64url).toMatchInlineSnapshot(
            `"VGhpcyBpcyBteSB0ZXN0YnVmZmVy"`
        );
    });

    it("decodeBase64url", () => {
        const base64url = encodeBase64url("This is my testbuffer");

        const result = decodeBase64url(base64url);

        expect(result).toMatchInlineSnapshot(`"This is my testbuffer"`);
    });
});
