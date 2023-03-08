const test = require('../../__fixtures/utils/test_helper').create();
describe(test.testName(__filename, 3), function () {
  this.timeout(20000);
  var service = require('../../../lib/services/cache/service');
  var serviceInstance = new service();
  var testId = require('shortid').generate();
  var config = {};

  before('should initialize the service', function (callback) {
    var UtilService = require('../../../lib/services/utils/service');
    var utilService = new UtilService();

    serviceInstance.happn = {
      services: {
        utils: utilService,
      },
    };

    serviceInstance.initialize(config, callback);
  });

  after(function (done) {
    serviceInstance.stop(done);
  });

  it('specific cache, sets data, ensures when we get a value back it is cloned by default', function () {
    var key = testId + 'test1';
    var data = { dkey: key };
    var Cache = require('../../../lib/services/cache/cache-static');
    var cache = new Cache('test');

    cache.utilities = require('happn-commons').utils;
    cache.set(key, data);
    const result = cache.get(key);

    test.chai.expect(result === data).to.be.false;
  });

  it('specific cache, sets data with clone: false, ensures when we get a value back it is not cloned', function () {
    var key = testId + 'test1';
    var data = { dkey: key };
    var Cache = require('../../../lib/services/cache/cache-static');
    var cache = new Cache('test');
    cache.set(key, data, { clone: false });
    const result = cache.get(key);

    test.chai.expect(result).to.eql({ dkey: key });
  });

  it('gets the cache keys', function () {
    var key = testId + 'test1';
    var data = { dkey: key };
    var Cache = require('../../../lib/services/cache/cache-static');
    var cache = new Cache('test');
    cache.set(key + '1', data, { clone: false });
    cache.set(key + '2', data, { clone: false });
    cache.set(key + '3', data, { clone: false });

    test.chai.expect(cache.keys().sort()).to.eql([key + '1', key + '2', key + '3']);
  });

  it('tests setInternal - appends timeout, deletes key after timeout', async () => {
    var key = testId + 'test1';
    var data = { dkey: key };
    var Cache = require('../../../lib/services/cache/cache-static');
    var cache = new Cache('test');

    const clearTimeoutSpy = test.sinon.spy(cache, 'clearTimeout');
    const setInternalSpy = test.sinon.spy(cache, 'setInternal');
    const getSpy = test.sinon.spy(cache, 'get');

    cache.set(key + '1', data, { clone: false, ttl: 1 });

    await test.delay(50);

    test.chai.expect(clearTimeoutSpy).to.have.been.calledTwice;
    test.chai.expect(setInternalSpy).to.have.been.calledOnce;
    test.chai.expect(getSpy).to.have.been.calledOnce;
    test.chai.expect(setInternalSpy).to.have.been.calledWithExactly(
      key + '1',
      {
        data: { dkey: key },
        key: key + '1',
        ttl: 1,
        noclone: true,
      },
      { clone: false, ttl: 1 }
    );
    test.chai.expect(cache.getInternal(key)).to.be.undefined;
  });

  it('tests removeInternal , removes key in cache', () => {
    var key = testId + 'test1';
    var data = { dkey: key };
    var Cache = require('../../../lib/services/cache/cache-static');
    var cache = new Cache('test');

    cache.set(key + '1', data, { clone: false });

    const result = cache.remove(key + '1', {});

    test.chai.expect(result).to.not.be.undefined;
    test.chai.expect(cache.getInternal()).to.be.undefined;
  });

  it('tests valuesInternal', () => {
    var key = testId + 'test1';
    var data = { dkey: key };
    var Cache = require('../../../lib/services/cache/cache-static');
    var cache = new Cache('test');

    cache.set(key + '1', data, { clone: false });
    cache.set(key + '2', data, { clone: false });
    cache.set(key + '3', data, { clone: false });

    const result = cache.values();

    test.chai.expect(result.length).to.equal(3);
  });

  it('tests hasInternal', () => {
    var key = testId + 'test1';
    var data = { dkey: key };
    var Cache = require('../../../lib/services/cache/cache-static');
    var cache = new Cache('test');

    cache.set(key + '1', data, { clone: false });

    const result = cache.has(key + '1');

    test.chai.expect(result).to.equal(true);
  });

  it('tests clearInternal', () => {
    var key = testId + 'test1';
    var data = { dkey: key };
    var Cache = require('../../../lib/services/cache/cache-static');
    var cache = new Cache('test');
    const stopSpy = test.sinon.spy(cache, 'stop');
    cache.set(key + '1', data, { clone: false, ttl: 1 });

    const result = cache.clear();

    test.chai.expect(result).to.be.undefined;
    test.chai.expect(stopSpy).to.have.been.calledOnce;
  });
});
