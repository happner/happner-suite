const CacheBase = require('../../../lib/services/cache/cache-base');
const test = require('../../__fixtures/utils/test_helper').create();

describe(test.testName(), () => {
  context('Constructor', () => {
    it('creates new instance', () => {
      const instance = new CacheBase('mockName', {});
      test.chai.expect(instance).to.be.an.instanceOf(CacheBase);
      test.chai.expect(instance.constructor.name).to.equal('CacheBase');
    });

    it('throws new error', () => {
      try {
        new CacheBase(null, {});
      } catch (error) {
        test.chai.expect(error.message).to.equal('invalid name for cache: null');
      }
    });
  });

  context('get', () => {
    it('gets name', () => {
      const instance = new CacheBase('mockName', {}); // Ca
      const result = instance.name;

      test.chai.expect(result).to.equal('mockName');
    });

    it('gets opts', () => {
      const instance = new CacheBase('mockName', {});
      const result = instance.opts;

      test.chai.expect(result).to.eql({});
    });
  });
});
