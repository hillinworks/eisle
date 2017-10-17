export interface IClonable<T> {
    clone(): T;
}

export namespace Clonable {
    export function clone<T>(value: T): T {
        return (value as any as IClonable<T>).clone();
    }
}