/* eslint-disable no-console,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { SchemaFactory } from '../../../lib/factories/schema-factory';

describe('full configuration tests', function () {
  it('resolves a top-level happn schema', () => {
    const factory = new SchemaFactory();
    const schema = factory.getSchema('happn');
    expect(schema).to.not.equal(null);
  });

  it('resolves a top-level happn-cluster schema', () => {
    const factory = new SchemaFactory();
    const schema = factory.getSchema('happn-cluster');
    expect(schema).to.not.equal(null);
  });

  it('resolves a top-level happner schema', () => {
    const factory = new SchemaFactory();
    const schema = factory.getSchema('happner');
    expect(schema).to.not.equal(null);
  });

  it('resolves a top-level happner-cluster schema', () => {
    const factory = new SchemaFactory();
    const schema = factory.getSchema('happner-cluster');
    expect(schema).to.not.equal(null);
  });

  it('resolves a sub schema', () => {
    const factory = new SchemaFactory();
    const schema = factory.getSchema('cache');
    expect(schema).to.not.equal(null);
  });
});
