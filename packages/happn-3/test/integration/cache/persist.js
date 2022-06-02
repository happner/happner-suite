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

  it(`sets, gets and removes data, specific cache, type: persist`, async () => {
    var key = testId + 'test1';
    var specific = serviceInstance.create('specific', cacheConfig);
    await specific.sync();
    const result = await specific.set(key, { dkey: key });
    test.expect(result.key).to.be(key);
    test.expect(result.data.dkey).to.be(key);
    const result2 = await specific.get(key);
    test.expect(result2.dkey).to.be(key);
    const result3 = await specific.get(key + 'bad');
    test.expect(result3).to.be(null);
    await specific.remove(key);
    const result4 = await specific.get(key);
    test.expect(result4).to.be(null);
  });

  it(`times data out, specific cache, type: persist`, async () => {
    const specific = serviceInstance.create('specific', cacheConfig);
    await specific.sync();
    await testTimeout(specific);
  });

  it(`times data out offline, then tries to sync again`, async () => {
    const specific = serviceInstance.create('specific', cacheConfig);
    await specific.sync();
    await testTimeoutSyncAgain(specific);
  });

  it(`clears the specific cache, type: persist`, async () => {
    const key = testId + 'test1';
    const specific = serviceInstance.create('specific-clear', cacheConfig);
    await specific.sync();
    await specific.clear();
    await specific.set(key, { dkey: key });
    await specific.set(key + 1, { dkey: key });
    await specific.set(key + 2, { dkey: key });
    test.expect(specific.size()).to.be(3);
    await specific.clear();
    test.expect(specific.size()).to.be(0);
    await specific.set(key, { dkey: key });
    test.expect(specific.size()).to.be(1);
  });

  it(`tests the increment and default option, specific cache, type: persist`, async () => {
    const key = testId + 'test1DefaultItemNotFound';
    const specific = serviceInstance.create('specific-increment-default', cacheConfig);
    await specific.sync();
    let item = await specific.get(key, {
      default: {
        value: 20,
        opts: { ttl: 1000 },
      },
    });
    test.expect(item).to.be(20);
    await test.delay(1100);
    item = await specific.get(key);
    test.expect(item).to.be(null);
    item = await specific.get(key, {
      default: {
        value: 20,
      },
    });
    test.expect(item).to.be(20);
    const incremented = await specific.increment(key, 15);
    test.expect(incremented).to.be(35);
    await specific.increment(key);
    item = await specific.get(key);
    test.expect(item).to.be(36);
    item = await specific.increment(key, 1, { ttl: 1000 });
    test.expect(item).to.be(37);
    await test.delay(1100);
    item = await specific.get(key);
    test.expect(item).to.be(null);
  });

  it(`tests the all function, specific cache, type: persist`, async () => {
    const specific = serviceInstance.create('specific-all', cacheConfig);
    await specific.sync();
    for (let time = 0; time < 5; time++) {
      const key = 'sync_key_' + time;
      await specific.set(key, { val: key });
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
    var recreated = serviceInstance.create('specific', cacheConfig);
    await recreated.sync();
    const resultAfterASecond = await recreated.get(key);
    test.expect(resultAfterASecond).to.be(null);
    await recreated.stop();
  }
});
