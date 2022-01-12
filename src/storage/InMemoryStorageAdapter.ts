/**
 * Implements an in-memory Storage-interface for local testing.
 * Frontends running in a browser should use localStorage
 */
export class InMemoryStorageAdapter implements Storage {
    public length = 0;

    constructor(protected data: Record<string, string> = {}) {
        this.updateLength();
    }

    public getItem(key: string) {
        return this.data[key] || null;
    }

    public setItem(key: string, value: string) {
        this.data[key] = value;
        this.updateLength();
    }

    public key(index: number) {
        return Object.keys(this.data)[index] || null;
    }

    public clear() {
        this.data = {};
        this.updateLength();
    }

    public removeItem(key: string): void {
        delete this.data[key];

        this.updateLength();
    }

    protected updateLength() {
        this.length = Object.keys(this.data).length;
    }
}
