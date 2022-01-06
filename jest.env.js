import { webcrypto } from "crypto"
import Environment from "jest-environment-jsdom"
import fetch, { Headers, Request, Response } from "node-fetch"
import { TextDecoder, TextEncoder } from "util"

// Custom test environment copied from https://github.com/jsdom/jsdom/issues/2524
// in order to add TextEncoder to jsdom. TextEncoder is expected by jose.

class CustomTestEnvironment extends Environment {
    async setup() {
        await super.setup()

        if (typeof this.global.fetch === "undefined") {
            this.global.fetch = fetch
            this.global.Headers = Headers
            this.global.Request = Request
            this.global.Response = Response
        }

        if (typeof this.global.crypto === "undefined") {
            this.global.crypto = webcrypto
        }

        if (typeof this.global.TextEncoder === "undefined") {
            this.global.TextEncoder = TextEncoder
            this.global.TextDecoder = TextDecoder
            this.global.ArrayBuffer = ArrayBuffer
            this.global.Uint8Array = Uint8Array
        }
    }
}

export default CustomTestEnvironment
