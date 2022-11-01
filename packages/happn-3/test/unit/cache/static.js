describe(
  require('../../__fixtures/utils/test_helper').create().testName(__filename, 3),
  function () {
    this.timeout(20000);
    var expect = require('expect.js');
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
      expect(result === data).to.be(false);
    });

    it('specific cache, sets data with clone: false, ensures when we get a value back it is not cloned', function () {
      var key = testId + 'test1';
      var data = { dkey: key };
      var Cache = require('../../../lib/services/cache/cache-static');
      var cache = new Cache('test');
      cache.set(key, data, { clone: false });
      const result = cache.get(key);
      expect(result).to.be(data);
    });

    it('gets the cache keys', function () {
      var key = testId + 'test1';
      var data = { dkey: key };
      var Cache = require('../../../lib/services/cache/cache-static');
      var cache = new Cache('test');
      cache.set(key + '1', data, { clone: false });
      cache.set(key + '2', data, { clone: false });
      cache.set(key + '3', data, { clone: false });
      expect(cache.keys().sort()).to.eql([key + '1', key + '2', key + '3']);
    });
  }
);
