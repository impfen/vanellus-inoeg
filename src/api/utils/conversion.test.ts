import { Buffer } from "buffer";
import {
    ab2str,
    b642buf,
    base322buf,
    buf2b64,
    buf2base32,
    str2ab,
} from "./conversion";

describe("conversions", () => {
    it("buf2base32", () => {
        const buffer = Buffer.from("This is my testbuffer");

        const base32 = buf2base32(buffer);

        expect(base32).toMatchInlineSnapshot(
            `"AHM6JWS0D5SJ0VBS41T6AWVMC9TPCSK5E8"`
        );
    });

    it("base322buf", () => {
        // "This is my testbuffer" as base32-crockford
        const base32 = "AHM6JWS0D5SJ0VBS41T6AWVMC9TPCSK5E8";

        const result = base322buf(base32);

        expect(result.toString()).toMatchInlineSnapshot(
            `"This is my testbuffer"`
        );
    });

    it("str2ab", () => {
        const arrayBuffer = str2ab("This is my teststring");

        expect(Buffer.from(arrayBuffer).toString()).toMatchInlineSnapshot(
            `"This is my teststring"`
        );
    });

    it("ab2str", () => {
        const arrayBuffer = new TextEncoder().encode("This is my testbuffer");

        const string = ab2str(arrayBuffer);

        expect(string).toMatchInlineSnapshot(`"This is my testbuffer"`);
    });

    it("buf2b64", () => {
        const buffer = Buffer.from("This is my testbuffer");

        const string = buf2b64(buffer);

        expect(string).toMatchInlineSnapshot(`"VGhpcyBpcyBteSB0ZXN0YnVmZmVy"`);
    });

    it("b642buf", () => {
        const base64 = "VGhpcyBpcyBteSB0ZXN0YnVmZmVy";

        const buffer2 = b642buf(base64);

        expect(buffer2.toString()).toMatchInlineSnapshot(
            `"This is my testbuffer"`
        );
    });
});
