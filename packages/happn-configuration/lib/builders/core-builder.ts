/* eslint-disable @typescript-eslint/ban-types,@typescript-eslint/no-var-requires,@typescript-eslint/no-explicit-any */
import BuilderConstants from '../constants/builder-constants';
import { ICoreBuilder } from './interfaces/i-core-builder';
import BaseBuilder from 'happn-commons/lib/base-builder';

const { HAPPN, HAPPN_CLUSTER, HAPPNER, HAPPNER_CLUSTER } = BuilderConstants;

export class CoreBuilder extends BaseBuilder implements ICoreBuilder {
  #builderType;
  #container: object;

  constructor(container) {
    super();
    this.#container = container;
  }

  set builderType(type) {
    this.#builderType = type;
  }

  get builderType() {
    return this.#builderType;
  }

  build() {
    const result = super.build();

    switch (this.builderType) {
      case HAPPN:
      case HAPPN_CLUSTER:
        return result.happn;
      case HAPPNER:
      case HAPPNER_CLUSTER:
        return result;
      default:
        throw new Error('unknown baseType');
    }
  }
}
