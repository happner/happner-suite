/* eslint-disable no-console,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { SchemaFactory } from '../../../lib/factories/schema-factory';

describe('full configuration tests', function () {
  it('resolves a top-level schema', () => {
    const factory = new SchemaFactory('1.0.0');
    const schema = factory.getSchema('happn');
    expect(schema).to.not.equal(null);
  });

  it('resolves a sub schema', () => {
    const factory = new SchemaFactory('1.0.0');
    const schema = factory.getSchema('cache');
    expect(schema).to.not.equal(null);
  });
});
