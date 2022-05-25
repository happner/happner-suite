[
  {
    service: {
      defaultCacheOpts: {
        type: 'LRU',
        cache: {
          max: 300,
          maxAge: 0,
        },
      },
    },
    specific: {
      type: 'lru',
      overwrite: true,
    },
  },
  {
    service: {
      defaultCacheOpts: {
        type: 'static',
      },
    },
    specific: {
      type: 'static',
      overwrite: true,
    },
  },
].forEach((config) => {
  require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, function (test) {
    const service = require('../../../lib/services/cache/service');
    const serviceInstance = new service();
    const testId = require('shortid').generate();

    before('should initialize the service', function (callback) {
      var UtilService = require('../../../lib/services/utils/service');
      var utilService = new UtilService();

      serviceInstance.happn = {
        services: {
          utils: utilService,
        },
      };

      serviceInstance.initialize(config.service, callback);
    });

    after(function (done) {
      serviceInstance.stop(done);
    });

    it(`sets, gets and removes data, specific cache, type: ${config.service.defaultCacheOpts.type}`, function () {
      var key = testId + 'test1';
      var specific = serviceInstance.create('specific', config.specific);
      const result = specific.set(key, { dkey: key });
      test.expect(result.key).to.be(key);
      test.expect(result.data.dkey).to.be(key);
      const result2 = specific.get(key);
      test.expect(result2.dkey).to.be(key);
      const result3 = specific.get(key + 'bad');
      test.expect(result3).to.be(null);
      specific.remove(key);
      const result4 = specific.get(key);
      test.expect(result4).to.be(null);
    });

    it(`times data out, specific cache, type: ${config.service.defaultCacheOpts.type}`, (done) => {
      testTimeout(serviceInstance.create('specific', config.specific), done);
    });

    it(`clears the specific cache, type: ${config.service.defaultCacheOpts.type}`, function () {
      this.timeout(5000);
      const key = testId + 'test1';
      const specific = serviceInstance.create('specific-clear', config.specific);
      specific.clear();
      specific.set(key, { dkey: key });
      specific.set(key + 1, { dkey: key });
      specific.set(key + 2, { dkey: key });
      test.expect(specific.size()).to.be(3);
      specific.clear();
      test.expect(specific.size()).to.be(0);
      specific.set(key, { dkey: key });
      test.expect(specific.size()).to.be(1);
    });

    it(`tests the increment and default option, specific cache, type: ${config.service.defaultCacheOpts.type}`, async () => {
      const key = testId + 'test1DefaultItemNotFound';
      const specific = serviceInstance.create('specific-increment-default', config.specific);
      let item = specific.get(key, {
        default: {
          value: 20,
          opts: { ttl: 1000 },
        },
      });
      test.expect(item).to.be(20);
      await test.delay(1100);
      item = specific.get(key);
      test.expect(item).to.be(null);
      item = specific.get(key, {
        default: {
          value: 20,
        },
      });
      test.expect(item).to.be(20);
      test.expect(item).to.be(20);
      const incremented = specific.increment(key, 15);
      test.expect(incremented).to.be(35);
      specific.increment(key);
      item = specific.get(key);
      test.expect(item).to.be(36);
      item = specific.increment(key, 1, { ttl: 1000 });
      test.expect(item).to.be(37);
      await test.delay(1100);
      item = specific.get(key);
      test.expect(item).to.be(null);
    });

    it(`tests the all function, specific cache, type: ${config.service.defaultCacheOpts.type}`, function () {
      const specific = serviceInstance.create('specific-all', config.specific);
      for (let time = 0; time < 5; time++) {
        const key = 'sync_key_' + time;
        specific.set(key, { val: key });
      }
      const all = specific.all();
      test.expect(all.length).to.be(5);
      test.expect(all[0].val).to.be('sync_key_' + 0);
      test.expect(all[1].val).to.be('sync_key_' + 1);
      test.expect(all[2].val).to.be('sync_key_' + 2);
      test.expect(all[3].val).to.be('sync_key_' + 3);
      test.expect(all[4].val).to.be('sync_key_' + 4);
      const filtered = specific.all({
        val: {
          $in: ['sync_key_1', 'sync_key_2'],
        },
      });
      test.expect(filtered.length).to.be(2);
      test.expect(filtered[0].val).to.be('sync_key_' + 1);
      test.expect(filtered[1].val).to.be('sync_key_' + 2);
    });

    function testTimeout(cacheOrService, done) {
      var key = testId + 'test1';
      cacheOrService.set(
        key,
        {
          dkey: key,
        },
        {
          ttl: 500,
        }
      );
      const resultBeforeASecond = cacheOrService.get(key);
      setTimeout(function () {
        const resultAfterASecond = cacheOrService.get(key);
        test.expect(resultAfterASecond).to.be(null);
        test.expect(resultBeforeASecond).to.not.be(null);
        done();
      }, 1000);
    }
  });
});
