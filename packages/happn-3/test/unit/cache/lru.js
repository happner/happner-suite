const test = require('../../__fixtures/utils/test_helper').create();
describe(test.testName(__filename, 3), function () {
  this.timeout(20000);
  var testId = require('shortid').generate();

  it('specific cache, sets data, ensures when we get a value back it is cloned by default', function () {
    var key = testId + 'test1';
    var data = { dkey: key };
    var Cache = require('../../../lib/services/cache/cache-lru');
    var cache = new Cache('test');

    cache.utilities = require('happn-commons').utils;
    cache.set(key, data);
    const result = cache.get(key);

    test.chai.expect(result === data).to.be.false;
  });

  it('specific cache, sets data with clone: false, ensures when we get a value back it is not cloned', function () {
    var key = testId + 'test1';
    var data = { dkey: key };
    var Cache = require('../../../lib/services/cache/cache-lru');
    var cache = new Cache('test');
    cache.set(key, data, { clone: false });
    const result = cache.get(key);

    test.chai.expect(result).to.eql(data);
  });

  it('gets the cache keys', function () {
    var key = testId + 'test1';
    var data = { dkey: key };
    var Cache = require('../../../lib/services/cache/cache-lru');
    var cache = new Cache('test');
    cache.set(key + '1', data, { clone: false });
    cache.set(key + '2', data, { clone: false });
    cache.set(key + '3', data, { clone: false });

    test.chai.expect(cache.keys().sort()).to.eql([key + '1', key + '2', key + '3']);
  });

  it('it removes key', () => {
    var key = testId + 'test1';
    var Cache = require('../../../lib/services/cache/cache-lru');
    var cache = new Cache('test', null);

    cache.set(key + '1', { dkey: key }, { clone: false });
    cache.set(key + '2', { dkey: key }, { clone: false });
    cache.set(key + '3', { dkey: key }, { clone: false });
    cache.removeInternal(key + '3');

    test.chai.expect(cache.keys().length).to.equal(2);
  });

  it('valuesInternal - returns value from valueList', () => {
    var key = testId + 'test1';
    var Cache = require('../../../lib/services/cache/cache-lru');
    var cache = new Cache('test', null);

    cache.set(key + '1', { dkey: key }, { clone: false });

    const result = cache.valuesInternal();

    test.chai.expect(result.length).to.equal(1);
  });

  it('sizeInternal - returns cache size', () => {
    var key = testId + 'test1';
    var Cache = require('../../../lib/services/cache/cache-lru');
    var cache = new Cache('test', {});

    cache.set(key + '1', { dkey: key }, { clone: false });
    cache.set(key + '2', { dkey: key }, { clone: false });
    cache.set(key + '3', { dkey: key }, { clone: false });

    const result = cache.sizeInternal();

    test.chai.expect(result).to.equal(3);
  });

  it('hasInternal - checks if a key is in the cache, without updating the recency of use', () => {
    var key = testId + 'test1';
    var Cache = require('../../../lib/services/cache/cache-lru');
    var cache = new Cache('test', { max: 10e3 });

    cache.set(key + '1', { dkey: key }, { clone: false });

    const result = cache.hasInternal(key);

    test.chai.expect(result).to.equal(false);
  });

  it('clearInterval - clears cache entirely', () => {
    var key = testId + 'test1';
    var Cache = require('../../../lib/services/cache/cache-lru');
    var cache = new Cache('test');

    cache.set(key + '1', { dkey: key }, { clone: false });
    cache.clearInternal(key);
    const result = cache.sizeInternal();

    test.chai.expect(result).to.equal(0);
  });

  it('allInternal - returns all values in cache', () => {
    var key = testId + 'test1';
    var Cache = require('../../../lib/services/cache/cache-lru');
    var cache = new Cache('test');

    cache.set(key + '1', { dkey: key }, { clone: false });
    cache.set(key + '2', { dkey: key }, { clone: false });
    cache.set(key + '3', { dkey: key }, { clone: false });

    const result = cache.allInternal(key);

    test.chai.expect(result.length).to.equal(3);
  });
});
