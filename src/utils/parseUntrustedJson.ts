export const parseUntrustedJSON = <T = unknown>(untrusted: string): T => {
    return JSON.parse(untrusted) as T;
};
