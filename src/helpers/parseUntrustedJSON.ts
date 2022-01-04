import { Optional } from "./optional"

export function parseUntrustedJSON<T = any>(untrusted: string): Optional<T> {
    try {
        return JSON.parse(untrusted)
    } catch (e) {
        console.error(e)
        return null
    }
}
