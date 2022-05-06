require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3, only: true }, function (test) {
  const service = require('../../../lib/services/cache/service');
  const serviceInstance = new service();
  const testId = require('shortid').generate();

  const config = {
    defaultCacheOpts: {
      type: 'LRU',
      cache: {
        max: 300,
        maxAge: 0,
      },
    },
  };

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

  it('sets, gets and removes data, default cache', function () {
    var key = testId + 'test1';
    const result = serviceInstance.set(key, { dkey: key });
    test.expect(result.key).to.be(key);
    test.expect(result.data.dkey).to.be(key);
    const result1 = serviceInstance.__defaultCache.get(key);
    test.expect(result1.dkey).to.be(key);
    const result2 = serviceInstance.get(key);
    test.expect(result2.dkey).to.be(key);
    const result3 = serviceInstance.get(key + 'bad');
    test.expect(result3).to.be(null);
    serviceInstance.remove(key);
    const result4 = serviceInstance.get(key);
    test.expect(result4).to.be(null);
  });

  it('sets, gets and removes data, specific cache', function () {
    var key = testId + 'test1';
    var specific = serviceInstance.new('specific', {
      type: 'lru',
    });
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

  it('times data out, default cache', (done) => {
    testTimeout(serviceInstance, done);
  });

  it('times data out, specific cache',  (done) => {
    testTimeout(serviceInstance.new('specific', {
    type: 'lru',
    overwrite: true,
  }), done) });

  it('clears the default cache', function (done) {
    var key = testId + 'test1';

    serviceInstance.set(
      key,
      {
        dkey: key,
      },
      function (e, result) {
        test.expect(result.key).to.be(key);
        test.expect(result.data.dkey).to.be(key);

        serviceInstance.get(key, function (e, data) {
          if (e) return done(e);

          test.expect(data.dkey).to.be(key);

          test.expect(serviceInstance.__defaultCache.__cache.size).to.be(3);

          serviceInstance.clear('default');

          test.expect(serviceInstance.__defaultCache.__cache.size).to.be(0);

          serviceInstance.get(key, function (e, data) {
            if (e) return done(e);

            if (data) return done(new Error('this was not meant to happn'));

            done();
          });
        });
      }
    );
  });

  it.only('clears the specific cache', function (done) {
    this.timeout(5000);
    const key = testId + 'test1';
    const specific = serviceInstance.new('specific', {
      type: 'lru',
      overwrite: true,
    });
    specific.set(key, { dkey: key });
    specific.set(key + '1', { dkey: key });
    test.expect(specific.size()).to.be(2);
    specific.clear();
    test.expect(specific.size()).to.be(0);
    done();
  });

  it('clears the default cache, then sets an item on it', function (done) {
    var key = testId + 'test1';

    serviceInstance.set(
      key,
      {
        dkey: key,
      },
      function (e, result) {
        if (e) return done(e);

        test.expect(result.key).to.be(key);
        test.expect(result.data.dkey).to.be(key);

        serviceInstance.get(key, function (e, data) {
          if (e) return done(e);

          test.expect(data.dkey).to.be(key);

          serviceInstance.clear('default');

          test.expect(serviceInstance.__defaultCache.__cache.size).to.be(0);

          serviceInstance.get(key, function (e, data) {
            if (e) return done(e);

            if (data) return done(new Error('this was not meant to happn'));

            serviceInstance.set(
              key,
              {
                dkey: key,
              },
              function (e) {
                if (e) return done(e);

                serviceInstance.get(key, function (e, data) {
                  if (e) return done(e);
                  test.expect(data.dkey).to.be(key);

                  done();
                });
              }
            );
          });
        });
      }
    );
  });

  it('tests the default mechanism and update, default cache', function (done) {
    serviceInstance.get(
      'nonexistantItem',
      {
        default: {
          ttl: 1000,
          value: 20,
        },
      },
      function (e, data) {
        if (e) return done(e);

        test.expect(data).to.be(20);

        serviceInstance.update('nonexistantItem', 30, function (e, cacheItem) {
          if (e) return done(e);

          test.expect(cacheItem.key).to.be('nonexistantItem');
          test.expect(cacheItem.data).to.be(30);

          test.expect(cacheItem.ttl).to.not.be(null);
          test.expect(cacheItem.ttl).to.not.be(undefined);

          serviceInstance.get('nonexistantItem', function (e, data) {
            if (e) return done(e);
            test.expect(data).to.be(30);

            serviceInstance.__defaultCache
              .get('nonexistantItem')
              .then(function (data) {
                test.expect(data).to.not.be(null);

                setTimeout(function () {
                  serviceInstance.__defaultCache
                    .get('nonexistantItem')
                    .then(function (data) {
                      test.expect(data).to.be(null);
                      done();
                    })
                    .catch(done);
                }, 3000);
              })
              .catch(done);
          });
        });
      }
    );
  });

  it('tests the default mechanism and update, specific cache', function (done) {
    this.timeout(5000);
    var key = testId + 'test1DefaultItemNotFound';

    serviceInstance.clear('specific');
    var specific = serviceInstance.new('specific', {
      type: 'lru',
    });

    specific.get(
      key,
      {
        default: {
          value: {
            nice: 'value',
          },
          ttl: 1000,
        },
      },
      function (e, data) {
        if (e) return done(e);

        test.expect(data).to.not.be(null);
        test.expect(data.nice).to.be('value');

        test.expect(serviceInstance.__caches.specific).to.not.be(undefined);

        setTimeout(function () {
          specific.get(key, function (e, data) {
            if (e) return done(e);

            test.expect(data).to.be(null);
            done();
          });
        }, 1200);
      }
    );
  });

  it('tests the increment function, default cache', function (done) {
    serviceInstance.get(
      'nonexistantItem',
      {
        default: {
          ttl: 1000,
          value: 20,
        },
      },
      function (e, data) {
        if (e) return done(e);

        test.expect(data).to.be(20);

        serviceInstance.increment('nonexistantItem', 30, function (e, data) {
          if (e) return done(e);

          test.expect(data).to.be(50);
          done();
        });
      }
    );
  });

  it('tests the increment function, specific cache', function (done) {
    this.timeout(5000);
    var key = testId + 'test1DefaultItemNotFound';

    serviceInstance.clear('specific');
    var specific = serviceInstance.new('specific', {
      type: 'lru',
    });

    specific.get(
      key,
      {
        default: {
          value: 20,
          ttl: 1000,
        },
      },
      function (e, data) {
        if (e) return done(e);

        test.expect(data).to.not.be(null);
        test.expect(serviceInstance.__caches.specific).to.not.be(undefined);

        specific.increment(key, 15, function (e, data) {
          if (e) return done(e);

          test.expect(data).to.be(35);
          done();
        });
      }
    );
  });

  it('tests the all function, specific cache', function (done) {
    serviceInstance.clear('specific');
    var specific = serviceInstance.new('specific');

    test.async.times(
      5,
      function (time, timeCB) {
        var key = 'sync_key_' + time;
        var opts = {};

        if (time === 4) opts.ttl = 2000;

        specific.set(
          key,
          {
            val: key,
          },
          opts,
          timeCB
        );
      },
      function (e) {
        if (e) return done(e);

        specific.all(function (e, items) {
          if (e) return done(e);

          test.expect(items.length).to.be(5);
          test.expect(items[0].val).to.be('sync_key_' + 0);
          test.expect(items[1].val).to.be('sync_key_' + 1);
          test.expect(items[2].val).to.be('sync_key_' + 2);
          test.expect(items[3].val).to.be('sync_key_' + 3);
          test.expect(items[4].val).to.be('sync_key_' + 4);

          done();
        });
      }
    );
  });

  it('tests the all with filter function, specific cache', function (done) {
    serviceInstance.clear('specific');
    var specific = serviceInstance.new('specific');

    test.async.times(
      5,
      function (time, timeCB) {
        var key = 'sync_key_' + time;
        var opts = {};

        if (time === 4) opts.ttl = 2000;

        specific.set(
          key,
          {
            val: key,
          },
          opts,
          timeCB
        );
      },
      function (e) {
        if (e) return done(e);

        specific.all(
          {
            val: {
              $in: ['sync_key_1', 'sync_key_2'],
            },
          },
          function (e, items) {
            if (e) return done(e);

            test.expect(items.length).to.be(2);

            //backwards because LRU
            test.expect(items[0].val).to.be('sync_key_' + 1);
            test.expect(items[1].val).to.be('sync_key_' + 2);

            done();
          }
        );
      }
    );
  });

  it('tests the sync methods', function (done) {
    this.timeout(10000);

    serviceInstance.clear('specific');
    var specific = serviceInstance.new('specific');
    specific.setSync('test-key', { test: 'data' }, { ttl: 3000 });
    test.expect(specific.getSync('test-key')).to.eql({ test: 'data' });

    setTimeout(function () {
      test.expect(specific.getSync('test-key')).to.be(null);
      specific.setSync('test-key-remove', { test: 'data' });
      test.expect(specific.getSync('test-key-remove')).to.eql({ test: 'data' });
      specific.removeSync('test-key-remove');
      test.expect(specific.getSync('test-key-remove')).to.be(null);
      done();
    }, 3001);
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
