const CacheService = require('../../../lib/services/cache/service');
const StaticCache = require('../../../lib/services/cache/cache-static');
const LRUCache = require('../../../lib/services/cache/cache-lru');
const CachePersist = require('../../../lib/services/cache/cache-persist');
const test = require('../../__fixtures/utils/test_helper').create();

describe(test.testName(), () => {
  let opts;
  let mockHappn;
  beforeEach(() => {
    opts = { logger: { createLogger: test.sinon.stub() } };
    mockHappn = { services: { utils: null }, name: 'mockName' };
  });

  afterEach(() => {
    opts = null;
    mockHappn = null;
  });

  context('static create', () => {
    it('creates new instance and creates logger if opts is null', () => {
      const instance = CacheService.create(null);
      test.chai.expect(instance).to.be.an.instanceOf(CacheService);
      test.chai.expect(instance.constructor.name).to.equal('CacheService');
    });

    it('creates new instance', () => {
      const traceStub = test.sinon.stub();
      opts.logger.createLogger.returns({ $$TRACE: traceStub });
      const instance = CacheService.create(opts);

      test.chai.expect(opts.logger.createLogger).to.have.been.calledOnce;
      test.chai.expect(opts.logger.createLogger).to.have.been.calledWithExactly('Cache');
      test.chai.expect(traceStub).to.have.been.calledOnce;
      test.chai.expect(traceStub).to.have.been.calledWithExactly('construct(%j)', {
        logger: { createLogger: test.sinon.match.func },
      });
      test.chai.expect(instance).to.be.an.instanceOf(CacheService);
      test.chai.expect(instance.constructor.name).to.equal('CacheService');
    });
  });

  context('iniitialize', () => {
    it('initialized service, reassigns config ', () => {
      const instance = CacheService.create(null);
      const config = test.sinon.stub();
      const result = instance.initialize(config);

      test.chai.expect(result).to.be.undefined;
      test.chai.expect(config).to.have.been.calledOnce;
    });

    it('initialized service, config is null ', () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      const result = instance.initialize(null, callback);

      test.chai.expect(result).to.be.undefined;
      test.chai.expect(callback).to.have.been.calledOnce;
    });

    it('initialized service, static interval less than 1000 ', () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      const warnStub = test.sinon.stub(instance.log, 'warn');
      const result = instance.initialize({ statisticsInterval: 900 }, callback);

      test.chai
        .expect(warnStub)
        .to.be.calledWithExactly('statisticsInterval smaller than a second, ignoring');
      test.chai.expect(warnStub).to.have.been.calledOnce;
      test.chai.expect(result).to.be.undefined;
      test.chai.expect(callback).to.have.been.calledOnce;
    });

    it('initialized service and creates cache, static interval is greater than 1000', async () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      const callbackTwo = test.sinon.stub();
      const infoStub = test.sinon.stub(instance.log.json, 'info');
      const nowStub = test.sinon.stub(Date, 'now').returns(500);
      instance.happn = mockHappn;

      instance.initialize({ statisticsInterval: 1500, overrides: null }, callback);
      const result = instance.create('mockName', { type: 'static' });
      await require('timers/promises').setTimeout(1500);
      instance.stop(null, callbackTwo);

      test.chai.expect(callbackTwo).to.have.been.calledOnce;
      test.chai.expect(callback).to.have.been.calledOnce;
      test.chai.expect(result).to.be.an.instanceOf(StaticCache);
      test.chai.expect(infoStub).to.have.been.calledWithExactly(
        {
          mockName: {
            hits: 0,
            misses: 0,
            size: 0,
            type: 'static',
            hitsPerSec: 0,
            missesPerSec: 0,
          },
          timestamp: 500,
          name: 'mockName',
        },
        'cache-service-statistics'
      );

      nowStub.restore();
      infoStub.restore();
    });

    it('initialized service and callback throws error', async () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      const warnStub = test.sinon.stub(instance.log, 'warn').throws(new Error('mockError'));

      instance.initialize({ statisticsInterval: 900, overrides: null }, callback);

      test.chai
        .expect(callback)
        .to.have.been.calledWithExactly(
          test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
        );
      test.chai.expect(callback).to.have.been.calledOnce;

      warnStub.restore();
    });
  });

  context('create cache instances', () => {
    it('creates StaticCache instance', () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      instance.happn = mockHappn;

      instance.initialize({ statisticsInterval: 900, overrides: null }, callback);
      const result = instance.create('mockName', {});

      test.chai.expect(result).to.be.an.instanceOf(StaticCache);
    });

    it('creates LRUCache instance', () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      instance.happn = mockHappn;

      instance.initialize({ statisticsInterval: 900, overrides: null }, callback);
      const result = instance.create('mockName', { cache: {}, type: 'lru' });

      test.chai.expect(result).to.be.an.instanceOf(LRUCache);
    });

    it('creates LRUCache instance', () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      instance.happn = mockHappn;

      instance.initialize({ statisticsInterval: 900, overrides: null }, callback);
      const result = instance.create('mockName', { cache: { dataStore: {} }, type: 'persist' });

      test.chai.expect(result).to.be.an.instanceOf(CachePersist);
    });

    it('throws errror if cache name already exists', () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      instance.happn = mockHappn;

      instance.initialize({ statisticsInterval: 900, overrides: null }, callback);
      instance.create('mockName', {});

      test.chai
        .expect(() => instance.create('mockName', undefined))
        .to.throw('a cache by this name already exists');
    });

    it('throws errror if cache type is unknown', () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      instance.happn = mockHappn;

      instance.initialize({ statisticsInterval: 900, overrides: null }, callback);

      test.chai
        .expect(() => instance.create('mockName', { type: 'mockType' }))
        .to.throw('unknown cache type: mocktype');
    });
  });

  context('clear and clearAll', () => {
    it('clears all cache', async () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      const clearSpy = test.sinon.spy(instance, 'clear');
      instance.happn = mockHappn;

      instance.initialize({ statisticsInterval: 900, overrides: null }, callback);
      instance.create('static', {});
      instance.create('lru', { cache: {}, type: 'lru' });
      await instance.clearAll(true);

      test.chai.expect(clearSpy).to.have.callCount(2);
      test.chai.expect(clearSpy).to.have.been.calledWithExactly('static', true);
      test.chai.expect(clearSpy).to.have.been.calledWithExactly('lru', true);
      clearSpy.restore();
    });

    it('clears cache cache and deletes it', async () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      const clearSpy = test.sinon.spy(LRUCache.prototype, 'clear');
      const emitSpy = test.sinon.spy(instance, 'emit');
      instance.happn = mockHappn;

      instance.initialize({ statisticsInterval: 900, overrides: null }, callback);
      instance.create('static', {});
      instance.create('lru', { cache: {}, type: 'lru' });
      await instance.clear('lru', true);

      test.chai.expect(clearSpy).to.have.been.calledOnce;
      test.chai.expect(emitSpy).to.have.been.calledTwice;
      test.chai.expect(emitSpy).to.have.been.calledWithExactly('cache-cleared', 'lru');
      test.chai.expect(emitSpy).to.have.been.calledWithExactly('cache-deleted', 'lru');

      clearSpy.restore();
    });

    it('checks if cache exists, it does not exists', async () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      const clearSpy = test.sinon.spy(LRUCache.prototype, 'clear');
      const emitSpy = test.sinon.spy(instance, 'emit');
      instance.happn = mockHappn;

      instance.initialize({ statisticsInterval: 900, overrides: null }, callback);
      instance.create('static', {});
      const result = instance.clear('lru', true);

      await test.chai.expect(result).to.eventually.be.undefined;
      test.chai.expect(clearSpy).to.not.have.been.calledOnce;
      test.chai.expect(emitSpy).to.not.have.been.calledTwice;

      clearSpy.restore();
      emitSpy.restore();
    });

    it('checks if deleteOnClear is true, it is undefined', async () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      const clearSpy = test.sinon.spy(LRUCache.prototype, 'clear');
      const emitSpy = test.sinon.spy(instance, 'emit');
      instance.happn = mockHappn;

      instance.initialize({ statisticsInterval: 900, overrides: null }, callback);
      instance.create('static', {});
      instance.create('lru', { cache: {}, type: 'lru' });
      await instance.clear('lru', undefined);

      test.chai.expect(clearSpy).to.have.been.calledOnce;
      test.chai.expect(emitSpy).to.have.been.calledOnce;
      test.chai.expect(emitSpy).to.have.been.calledWithExactly('cache-cleared', 'lru');

      emitSpy.restore();
      clearSpy.restore();
    });
  });

  context('delete', () => {
    it('checks if cache is already cleared and emits cache-deleted', async () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      const clearSpy = test.sinon.spy(LRUCache.prototype, 'clear');
      const emitSpy = test.sinon.spy(instance, 'emit');
      instance.happn = mockHappn;

      instance.initialize({ statisticsInterval: 900, overrides: null }, callback);
      instance.create('static', {});
      instance.create('lru', { cache: {}, type: 'lru' });
      instance.delete('lru', false);

      test.chai.expect(emitSpy).to.have.been.calledOnce;
      test.chai.expect(emitSpy).to.have.been.calledWithExactly('cache-deleted', 'lru');
      test.chai.expect(clearSpy).to.have.not.been.calledOnce;

      clearSpy.restore();
      emitSpy.restore();
    });

    it('checks if cache that needs to be deleted exist, it does not exist', () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      const clearSpy = test.sinon.spy(LRUCache.prototype, 'clear');
      const emitSpy = test.sinon.spy(instance, 'emit');
      instance.happn = mockHappn;

      instance.initialize({ statisticsInterval: 900, overrides: null }, callback);
      instance.create('static', {});
      const result = instance.delete('lru', undefined);

      test.chai.expect(result).to.be.undefined;
      test.chai.expect(emitSpy).to.not.have.been.calledOnce;
      test.chai.expect(clearSpy).to.have.not.been.calledOnce;

      clearSpy.restore();
      emitSpy.restore();
    });
  });

  context('stop', () => {
    it('stops cache service, #statisticsInterval is falsy and callback is not a function', () => {
      const instance = CacheService.create();
      const stopAllSpy = test.sinon.spy(instance, 'stopAll');

      instance.stop({}, 'mockCallback');

      test.chai.expect(stopAllSpy).to.have.been.calledOnce;

      stopAllSpy.restore();
    });

    it('stops cache service, options is a function', () => {
      const instance = CacheService.create();
      const stopAllSpy = test.sinon.spy(instance, 'stopAll');
      const callback = test.sinon.stub();

      instance.stop(callback);

      test.chai.expect(stopAllSpy).to.have.been.calledOnce;
      test.chai.expect(callback).to.have.been.calledOnce;

      stopAllSpy.restore();
    });
  });

  context('getCache and getOrCreate', () => {
    it('gets cache', async () => {
      const instance = CacheService.create(null);
      const callback = test.sinon.stub();
      instance.happn = mockHappn;

      instance.initialize({ statisticsInterval: 900, overrides: null }, callback);
      instance.create('static', {});
      instance.create('lru', { cache: {}, type: 'lru' });
      const result = instance.getCache('lru');

      test.chai.expect(result.instance).to.be.an.instanceOf(LRUCache);
    });
  });
});
