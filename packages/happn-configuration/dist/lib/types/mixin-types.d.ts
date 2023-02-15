declare const BaseBuilder: any;
export type Constructor<T = typeof BaseBuilder> = new (...args: any[]) => T;
export {};
