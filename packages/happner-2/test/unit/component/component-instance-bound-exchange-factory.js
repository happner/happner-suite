require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const BoundExchangeFactory = require('../../../lib/system/component-instance-bound-factory');
  const EventEmitter = require('events').EventEmitter;
  const eventEmitter = new EventEmitter();
  const LRUCache = require('happn-3/lib/services/cache/cache-lru');
  it('can initialize a bound exchange item', function () {
    const boundExchangeFactory = BoundExchangeFactory.create(mockComponentInstance(), mockMesh());
    const boundComponent = boundExchangeFactory.getBoundComponent({ username: 'test' });
    test.expect(boundComponent.exchange.test).to.not.be(null);
    test.expect(boundExchangeFactory.cache.size()).to.be(1);
  });

  function mockComponentInstance() {
    return {
      config: {},
      exchange: {
        test: test.sinon.stub(),
      },
      event: {
        test: test.sinon.stub(),
      },
    };
  }

  function mockMesh(boundExchangeCacheSize = 5) {
    return {
      config: {
        authorityDelegationOn: true,
        happn: {
          secure: true,
        },
        components: {
          security: {
            config: {
              boundExchangeCacheSize,
            },
          },
        },
      },
      happn: {
        server: {
          services: {
            security: eventEmitter,
            cache: {
              getOrCreate: function () {
                return new LRUCache('test', {
                  cache: {
                    max: boundExchangeCacheSize,
                  },
                });
              },
            },
          },
        },
      },
    };
  }
});
