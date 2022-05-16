require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, function (test) {
  const UtilService = require('../../../lib/services/utils/service');
  const DataService = require('../../../lib/services/data/service');
  const dataServiceInstance = new DataService();
  const service = require('../../../lib/services/cache/service');
  const serviceInstance = new service();
  const config = {};

  beforeEach('should initialize the service', function (callback) {
    dataServiceInstance.happn = {
      services: {
        utils: new UtilService(),
        system: {
          package: require('../../../package.json'),
        },
      },
    };

    dataServiceInstance.initialize({}, function (e) {
      if (e) return callback(e);
      serviceInstance.happn = {
        services: {
          utils: new UtilService(),
        },
      };
      serviceInstance.initialize(config, callback);
    });
  });

  afterEach(function (done) {
    serviceInstance.stop(done);
  });

  after(async () => {
    await serviceInstance.stop();
  });

  it('creates 3 different types of cache, collects stats, clears and deletes all as well, and checks events', async () => {
    const eventData = [];
    function onEvent(eventKey) {
      return (data) => {
        eventData.push({ eventKey, data });
      };
    }
    serviceInstance.on('cache-cleared', onEvent('cache-cleared'));
    serviceInstance.on('cache-deleted', onEvent('cache-deleted'));

    const lruCache = serviceInstance.create('lru', {
      type: test.commons.constants.CACHE_TYPES.LRU,
    });
    const staticCache = serviceInstance.create('static', {
      type: test.commons.constants.CACHE_TYPES.STATIC,
    });
    const persistCache = serviceInstance.create('persist', {
      type: test.commons.constants.CACHE_TYPES.PERSIST,
      cache: {
        dataStore: dataServiceInstance,
      },
    });
    await persistCache.sync();
    test.expect(serviceInstance.getStats()).to.eql({
      lru: {
        type: test.commons.constants.CACHE_TYPES.LRU,
        size: 0,
        hits: 0,
        misses: 0,
      },
      static: {
        type: test.commons.constants.CACHE_TYPES.STATIC,
        size: 0,
        hits: 0,
        misses: 0,
      },
      persist: {
        type: test.commons.constants.CACHE_TYPES.PERSIST,
        size: 0,
        hits: 0,
        misses: 0,
      },
    });

    lruCache.get('test-key-1');
    staticCache.get('test-key-1');
    await persistCache.get('test-key-1');

    test.expect(serviceInstance.getStats()).to.eql({
      lru: {
        type: test.commons.constants.CACHE_TYPES.LRU,
        size: 0,
        hits: 0,
        misses: 1,
      },
      static: {
        type: test.commons.constants.CACHE_TYPES.STATIC,
        size: 0,
        hits: 0,
        misses: 1,
      },
      persist: {
        type: test.commons.constants.CACHE_TYPES.PERSIST,
        size: 0,
        hits: 0,
        misses: 1,
      },
    });

    lruCache.set('test-key-1', { dkey: 1 });
    staticCache.set('test-key-1', { dkey: 1 });
    await persistCache.set('test-key-1', { dkey: 1 });

    lruCache.get('test-key-1');
    staticCache.get('test-key-1');
    await persistCache.get('test-key-1');

    test.expect(serviceInstance.getStats()).to.eql({
      lru: {
        type: test.commons.constants.CACHE_TYPES.LRU,
        size: 1,
        hits: 1,
        misses: 1,
      },
      static: {
        type: test.commons.constants.CACHE_TYPES.STATIC,
        size: 1,
        hits: 1,
        misses: 1,
      },
      persist: {
        type: test.commons.constants.CACHE_TYPES.PERSIST,
        size: 1,
        hits: 1,
        misses: 1,
      },
    });
    await serviceInstance.clearAll(true);
    await test.delay(2000);
    test.expect(serviceInstance.getStats()).to.eql({});
    test.expect(eventData).to.eql([
      { eventKey: 'cache-cleared', data: 'lru' },
      { eventKey: 'cache-deleted', data: 'lru' },
      { eventKey: 'cache-cleared', data: 'static' },
      { eventKey: 'cache-deleted', data: 'static' },
      { eventKey: 'cache-cleared', data: 'persist' },
      { eventKey: 'cache-deleted', data: 'persist' },
    ]);
  });

  it('creates a default static cache', async () => {
    const eventData = [];
    function onEvent(eventKey) {
      return (data) => {
        eventData.push({ eventKey, data });
      };
    }
    serviceInstance.on('cache-cleared', onEvent('cache-cleared'));
    serviceInstance.on('cache-deleted', onEvent('cache-deleted'));

    const lruCache = serviceInstance.create('lru', {
      type: test.commons.constants.CACHE_TYPES.LRU,
    });
    const staticCache = serviceInstance.create('static', {
      type: test.commons.constants.CACHE_TYPES.STATIC,
    });
    const persistCache = serviceInstance.create('persist', {
      type: test.commons.constants.CACHE_TYPES.PERSIST,
      cache: {
        dataStore: dataServiceInstance,
      },
    });
    await persistCache.sync();
    test.expect(serviceInstance.getStats()).to.eql({
      lru: {
        type: test.commons.constants.CACHE_TYPES.LRU,
        size: 0,
        hits: 0,
        misses: 0,
      },
      static: {
        type: test.commons.constants.CACHE_TYPES.STATIC,
        size: 0,
        hits: 0,
        misses: 0,
      },
      persist: {
        type: test.commons.constants.CACHE_TYPES.PERSIST,
        size: 0,
        hits: 0,
        misses: 0,
      },
    });

    lruCache.get('test-key-1');
    staticCache.get('test-key-1');
    await persistCache.get('test-key-1');

    test.expect(serviceInstance.getStats()).to.eql({
      lru: {
        type: test.commons.constants.CACHE_TYPES.LRU,
        size: 0,
        hits: 0,
        misses: 1,
      },
      static: {
        type: test.commons.constants.CACHE_TYPES.STATIC,
        size: 0,
        hits: 0,
        misses: 1,
      },
      persist: {
        type: test.commons.constants.CACHE_TYPES.PERSIST,
        size: 0,
        hits: 0,
        misses: 1,
      },
    });

    lruCache.set('test-key-1', { dkey: 1 });
    staticCache.set('test-key-1', { dkey: 1 });
    await persistCache.set('test-key-1', { dkey: 1 });

    lruCache.get('test-key-1');
    staticCache.get('test-key-1');
    await persistCache.get('test-key-1');

    test.expect(serviceInstance.getStats()).to.eql({
      lru: {
        type: test.commons.constants.CACHE_TYPES.LRU,
        size: 1,
        hits: 1,
        misses: 1,
      },
      static: {
        type: test.commons.constants.CACHE_TYPES.STATIC,
        size: 1,
        hits: 1,
        misses: 1,
      },
      persist: {
        type: test.commons.constants.CACHE_TYPES.PERSIST,
        size: 1,
        hits: 1,
        misses: 1,
      },
    });
    await serviceInstance.clearAll(true);
    await test.delay(2000);
    test.expect(serviceInstance.getStats()).to.eql({});
    test.expect(eventData).to.eql([
      { eventKey: 'cache-cleared', data: 'lru' },
      { eventKey: 'cache-deleted', data: 'lru' },
      { eventKey: 'cache-cleared', data: 'static' },
      { eventKey: 'cache-deleted', data: 'static' },
      { eventKey: 'cache-cleared', data: 'persist' },
      { eventKey: 'cache-deleted', data: 'persist' },
    ]);
  });
});
