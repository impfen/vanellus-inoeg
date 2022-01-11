import { Buffer } from "buffer";
import { decodeBase32, encodeBase32 } from ".";
import {
    arrayBufferToString,
    base64ToBuffer,
    bufferToBase64,
    stringToArrayBuffer,
} from "./conversion";

describe("conversions", () => {
    it("encodeBase32", () => {
        const base32 = encodeBase32("This is my testbuffer");

        expect(base32).toMatchInlineSnapshot(
            `"AHM6JWS0D5SJ0VBS41T6AWVMC9TPCSK5E8"`
        );
    });

    it("base32Decode", () => {
        // "This is my testbuffer" as base32-crockford
        const base32 = "AHM6JWS0D5SJ0VBS41T6AWVMC9TPCSK5E8";

        const result = decodeBase32(base32);

        expect(result.toString()).toMatchInlineSnapshot(
            `"This is my testbuffer"`
        );
    });

    it("stringToArrayBuffer", () => {
        const arrayBuffer = stringToArrayBuffer("This is my teststring");

        expect(Buffer.from(arrayBuffer).toString()).toMatchInlineSnapshot(
            `"This is my teststring"`
        );
    });

    it("arrayBufferToString", () => {
        const arrayBuffer = new TextEncoder().encode("This is my testbuffer");

        const string = arrayBufferToString(arrayBuffer);

        expect(string).toMatchInlineSnapshot(`"This is my testbuffer"`);
    });

    it("bufferToBase64", () => {
        const buffer = Buffer.from("This is my testbuffer");

        const string = bufferToBase64(buffer);

        expect(string).toMatchInlineSnapshot(`"VGhpcyBpcyBteSB0ZXN0YnVmZmVy"`);
    });

    it("base64ToBuffer", () => {
        const base64 = "VGhpcyBpcyBteSB0ZXN0YnVmZmVy";

        const buffer2 = base64ToBuffer(base64);

        expect(buffer2.toString()).toMatchInlineSnapshot(
            `"This is my testbuffer"`
        );
    });
});
