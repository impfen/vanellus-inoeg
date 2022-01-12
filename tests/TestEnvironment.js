import { webcrypto } from "crypto";
import Environment from "jest-environment-jsdom";
import fetch, { Headers, Request, Response } from "node-fetch";
import { TextDecoder, TextEncoder } from "util";

class TestEnvironment extends Environment {
    async setup() {
        await super.setup();

        this.global.fetch = fetch;
        this.global.Headers = Headers;
        this.global.Request = Request;
        this.global.Response = Response;
        this.global.crypto = webcrypto;
        this.global.TextEncoder = TextEncoder;
        this.global.TextDecoder = TextDecoder;
        this.global.ArrayBuffer = ArrayBuffer;
        this.global.Uint8Array = Uint8Array;
        this.global.Uint32Array = Uint32Array;
    }
}

export default TestEnvironment;
