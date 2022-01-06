export function parseUntrustedJSON<T = unknown>(untrusted: string): T {
    return JSON.parse(untrusted)
}
