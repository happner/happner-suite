/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');

export type Constructor<T = typeof BaseBuilder> = new (...args: any[]) => T;
