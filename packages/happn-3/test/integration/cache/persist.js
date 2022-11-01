require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, function (test) {
  const service = require('../../../lib/services/cache/service');
  const dataService = require('../../../lib/services/data/service');
  const serviceInstance = new service();
  const dataStore = new dataService();
  const testId = test.newid();
  const config = {};
  const cacheConfig = {
    type: test.commons.constants.CACHE_TYPES.PERSIST,
    cache: {
      key_prefix: 'PERSIST_TEST',
      dataStore,
      keyTransformers: [
        {
          regex: /^(?<keyMask>\/_partial\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+)\/[a-zA-Z0-9]+/,
        },
      ],
    },
    overwrite: true,
  };

  beforeEach('should initialize the service', function (callback) {
    var UtilService = require('../../../lib/services/utils/service');
    var utilService = new UtilService();

    dataStore.happn = {
      services: {
        utils: utilService,
        system: {
          package: require('../../../package.json'),
        },
      },
    };

    dataStore.initialize({}, function (e) {
      if (e) return callback(e);
      serviceInstance.happn = {
        services: {
          utils: utilService,
        },
      };
      serviceInstance.initialize(config, callback);
    });
  });

  afterEach(function (done) {
    serviceInstance.stop(done);
  });

  it(`sets, gets and removes data, testCache cache, type: persist`, async () => {
    var key = testId + 'test1';
    var testCache = serviceInstance.create('testCache', cacheConfig);
    await testCache.sync();
    const result = await testCache.set(key, { dkey: key });
    test.expect(result.key).to.be(key);
    test.expect(result.data.dkey).to.be(key);
    const result2 = await testCache.get(key);
    test.expect(result2.dkey).to.be(key);
    const result3 = await testCache.get(key + 'bad');
    test.expect(result3).to.be(null);
    await testCache.remove(key);
    const result4 = await testCache.get(key);
    test.expect(result4).to.be(null);
  });

  it(`times data out, testCache cache, type: persist`, async () => {
    const testCache = serviceInstance.create('testCache', cacheConfig);
    await testCache.sync();
    await testTimeout(testCache);
  });

  it(`times data out offline, then tries to sync again`, async () => {
    const testCache = serviceInstance.create('testCache', cacheConfig);
    await testCache.sync();
    await testTimeoutSyncAgain(testCache);
  });

  it(`clears the testCache cache, type: persist`, async () => {
    const key = testId + 'test1';
    const testCache = serviceInstance.create('testCache-clear', cacheConfig);
    await testCache.sync();
    await testCache.clear();
    await testCache.set(key, { dkey: key });
    await testCache.set(key + 1, { dkey: key });
    await testCache.set(key + 2, { dkey: key });
    test.expect(testCache.size()).to.be(3);
    await testCache.clear();
    test.expect(testCache.size()).to.be(0);
    await testCache.set(key, { dkey: key });
    test.expect(testCache.size()).to.be(1);
  });

  it(`tests the increment and default option, testCache cache, type: persist`, async () => {
    const key = testId + 'test1DefaultItemNotFound';
    const testCache = serviceInstance.create('testCache-increment-default', cacheConfig);
    await testCache.sync();
    let item = await testCache.get(key, {
      default: {
        value: 20,
        opts: { ttl: 1000 },
      },
    });
    test.expect(item).to.be(20);
    await test.delay(1100);
    item = await testCache.get(key);
    test.expect(item).to.be(null);
    item = await testCache.get(key, {
      default: {
        value: 20,
      },
    });
    test.expect(item).to.be(20);
    const incremented = await testCache.increment(key, 15);
    test.expect(incremented).to.be(35);
    await testCache.increment(key);
    item = await testCache.get(key);
    test.expect(item).to.be(36);
    item = await testCache.increment(key, 1, { ttl: 1000 });
    test.expect(item).to.be(37);
    await test.delay(1100);
    item = await testCache.get(key);
    test.expect(item).to.be(null);
  });

  it(`sets, gets and removes data, with a keyTransformer regex partial without transform method and keyMask group, type: persist`, async () => {
    let key = '/_partial/component2/method3/12345';
    let transformedKey = '/_partial/component2/method3';
    let testCache = serviceInstance.create('testCache', cacheConfig);
    await testCache.sync();

    const result = await testCache.set(key, { dkey: key });
    test.expect(testCache.keys()).to.eql(['/_partial/component2/method3']);
    test.expect(result.key).to.be(transformedKey);
    test.expect(result.data.dkey).to.be(key);
    const result2 = await testCache.get(key);
    test.expect(result2.dkey).to.be(key);
    const result3 = await testCache.get('/_partial/component2');
    test.expect(result3).to.be(null);

    // clears and resyncs
    await testCache.sync();
    const resultAfterSync = await testCache.get(key);
    test.expect(resultAfterSync.dkey).to.be(key);

    await testCache.remove(key);
    test.expect(testCache.keys()).to.eql([]);
    const result4 = await testCache.get(key);
    test.expect(result4).to.be(null);
  });

  it(`tests the all function, testCache cache, type: persist`, async () => {
    const testCache = serviceInstance.create('testCache-all', cacheConfig);
    await testCache.sync();
    test.expect(testCache.isSyncing).to.be(false);
    test.expect(testCache.isSynced).to.be(true);
    for (let time = 0; time < 5; time++) {
      const key = 'sync_key_' + time;
      await testCache.set(key, { val: key });
    }
    const all = testCache.all();
    test.expect(all.length).to.be(5);
    test.expect(all[0].val).to.be('sync_key_' + 0);
    test.expect(all[1].val).to.be('sync_key_' + 1);
    test.expect(all[2].val).to.be('sync_key_' + 2);
    test.expect(all[3].val).to.be('sync_key_' + 3);
    test.expect(all[4].val).to.be('sync_key_' + 4);
    const filtered = testCache.all({
      val: {
        $in: ['sync_key_1', 'sync_key_2'],
      },
    });
    test.expect(filtered.length).to.be(2);
    test.expect(filtered[0].val).to.be('sync_key_' + 1);
    test.expect(filtered[1].val).to.be('sync_key_' + 2);
  });

  it(`tests various error states`, async () => {
    const errorCacheConfig = {
      type: test.commons.constants.CACHE_TYPES.PERSIST,
      cache: {
        key_prefix: 'PERSIST_TEST',
        dataStore: {
          get: (_path, cb) => {
            cb(new Error('test get error'));
          },
        },
      },
      overwrite: true,
    };
    const testCache = serviceInstance.create('testCache-error', errorCacheConfig);
    let errorMessage;
    try {
      await testCache.sync();
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('test get error');
    test.expect(testCache.isSyncing).to.be(false);
    test.expect(testCache.isSynced).to.be(false);
    errorCacheConfig.cache.dataStore.get = (_path, cb) => {
      cb(null, [{ data: {} }]);
    };
    testCache.set = (_key, _data, _opts, cb) => {
      cb(new Error('test set error'));
    };
    try {
      await testCache.sync();
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('test set error');
    test.expect(testCache.isSyncing).to.be(false);
    test.expect(testCache.isSynced).to.be(false);
  });

  function testTimeout(cache) {
    return new Promise((resolve, reject) => {
      var key = testId + 'test1';
      cache
        .set(
          key,
          {
            dkey: key,
          },
          {
            ttl: 500,
          }
        )
        .then(async () => {
          const resultBeforeASecond = await cache.get(key);
          setTimeout(async () => {
            const resultAfterASecond = await cache.get(key);
            test.expect(resultAfterASecond).to.be(null);
            test.expect(resultBeforeASecond).to.not.be(null);
            resolve();
          }, 1000);
        })
        .catch(reject);
    });
  }

  async function testTimeoutSyncAgain(cache) {
    var key = testId + 'test1';
    await cache.set(
      key,
      {
        dkey: key,
      },
      {
        ttl: 2000,
      }
    );
    await cache.stop();
    await test.delay(2100);
    var recreated = serviceInstance.create('testCache', cacheConfig);
    await recreated.sync();
    const resultAfterASecond = await recreated.get(key);
    test.expect(resultAfterASecond).to.be(null);
    await recreated.stop();
  }
});
