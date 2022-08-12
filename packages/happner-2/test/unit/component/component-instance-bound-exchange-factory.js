require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const BoundExchangeFactory = require('../../../lib/system/component-instance-bound-factory');
  const EventEmitter = require('events').EventEmitter;
  const eventEmitter = new EventEmitter();
  const LRUCache = require('happn-3/lib/services/cache/cache-lru');

  it('can initialize a bound exchange item', function () {
    const mockedMesh = mockMesh();
    const mockedComponent = mockComponentInstance(
      undefined,
      mockedMesh,
      'backward-compatible-mesh'
    );
    const boundExchangeFactory = BoundExchangeFactory.create(mockedComponent, mockedMesh);
    const boundComponent = boundExchangeFactory.getBoundComponent({ username: 'test' });
    test.expect(boundComponent._mesh).to.be(mockedMesh);
    test.expect(boundComponent.mesh).to.be('backward-compatible-mesh');
    test.expect(boundComponent.bound).to.eql({ username: 'test', override: true, type: 1 });
    test.expect(boundComponent.exchange.testComponent).to.not.be(undefined);
    test.expect(boundComponent.exchange.testComponent.testMethod).to.not.be(undefined);
    test.expect(boundComponent.exchange.testComponent.testMethod1).to.not.be(undefined);
    test.expect(boundComponent.exchange.testComponent1).to.not.be(undefined);
    test.expect(boundComponent.exchange.unknownComponent).to.be(undefined);
    test.expect(boundComponent.event.testComponent1).to.not.be(undefined);
    test.expect(boundComponent.event.testComponent).to.not.be(undefined);
    test.expect(boundExchangeFactory.cache.size()).to.be(1);
    const boundComponent1 = boundExchangeFactory.getBoundComponent(
      { username: 'test' },
      undefined,
      'testComponent',
      'testMethod',
      0
    );
    test.expect(boundComponent1.exchange.testComponent).to.not.be(undefined);
    test.expect(boundComponent1.exchange.testComponent.testMethod).to.not.be(undefined);
    test.expect(boundComponent1.exchange.testComponent.testMethod1).to.be(undefined);
    test.expect(boundComponent1.exchange.testComponent1).to.be(undefined);
    test.expect(boundComponent1.event.testComponent1).to.be(undefined);
    test.expect(boundComponent1.event.testComponent).to.not.be(undefined);
    test.expect(boundComponent.exchange.unknownComponent).to.be(undefined);
    test.expect(boundExchangeFactory.cache.size()).to.be(2);
    test
      .expect(boundExchangeFactory.cache.keys())
      .to.eql(['test:*:*:1', 'test:testComponent:testMethod:0']);

    //check we are able to get a cached bound component
    test
      .expect(
        boundExchangeFactory.getBoundComponent(
          { username: 'test' },
          undefined,
          'testComponent',
          'testMethod',
          0
        )
      )
      .to.be(boundComponent1);
    test.expect(boundExchangeFactory.cache.size()).to.be(2);

    //cache  must be cleared when the security changes
    mockedMesh.happn.server.services.security.emit('security-data-changed');
    test.expect(boundExchangeFactory.cache.size()).to.be(0);

    test
      .expect(boundExchangeFactory.getBoundComponent({ username: '_ADMIN' }))
      .to.be(mockedComponent);
  });

  it('tests origin binding check', function () {
    const boundExchangeFactory = BoundExchangeFactory.create(
      mockComponentInstance(),
      mockMesh(undefined, undefined, true)
    );
    const boundExchangeFactoryUnsecure = BoundExchangeFactory.create(
      mockComponentInstance(),
      mockMesh(undefined, false)
    );
    const boundExchangeFactoryAuthDelegationOff = BoundExchangeFactory.create(
      mockComponentInstance(false),
      mockMesh(undefined, undefined, true)
    );
    const boundExchangeFactoryAllAuthDelegationOff = BoundExchangeFactory.create(
      mockComponentInstance(false),
      mockMesh(undefined, undefined, false)
    );
    checkOriginBindingNecessary(boundExchangeFactoryUnsecure, { username: 'test' }, true, false);
    checkOriginBindingNecessary(boundExchangeFactory, { username: '_ADMIN' }, true, false);
    checkOriginBindingNecessary(boundExchangeFactory, { username: '_ADMIN' }, null, false);
    checkOriginBindingNecessary(boundExchangeFactory, { username: 'test' }, null, true);
    checkOriginBindingNecessary(
      boundExchangeFactory,
      { username: 'test', override: true },
      null,
      true
    );
    checkOriginBindingNecessary(
      boundExchangeFactory,
      { username: 'test', override: false },
      null,
      false
    );
    checkOriginBindingNecessary(
      boundExchangeFactoryAuthDelegationOff,
      { username: 'test' },
      null,
      false
    );
    checkOriginBindingNecessary(
      boundExchangeFactoryAllAuthDelegationOff,
      { username: 'test' },
      undefined,
      false
    );
  });

  function checkOriginBindingNecessary(boundExchangeFactory, origin, override, expectation) {
    test.expect(boundExchangeFactory.originBindingNecessary(origin, override)).to.be(expectation);
  }

  function mockComponentInstance(authorityDelegationOn = true, _mesh, mesh) {
    const mockEndpoint = {
      data: {},
    };
    return {
      as: test.sinon.stub(),
      mesh,
      _mesh,
      config: {
        security: {
          authorityDelegationOn,
        },
      },
      exchange: {
        $call: test.sinon.stub(),
        testComponent: {
          testMethod: test.sinon.stub(),
          testMethod1: test.sinon.stub(),
          testField: 'test-field-value',
        },
        testComponent1: {
          testMethod: test.sinon.stub(),
          testMethod1: test.sinon.stub(),
        },
        testNestedComponent1: {
          testChildComponent: {
            testMethod: test.sinon.stub(),
            testMethod1: test.sinon.stub(),
          },
        },
      },
      event: {
        $call: test.sinon.stub(),
        testComponent: {
          __endpoint: mockEndpoint,
          __domain: 'test-domain',
        },
        testComponent1: {},
        testNestedComponent1: {
          testChildComponent: {
            __endpoint: mockEndpoint,
            __domain: 'test-domain',
          },
        },
        testNestedComponent2: {
          testChildComponent: {
            __domain: 'test-domain',
          },
        },
      },
    };
  }

  function mockMesh(boundExchangeCacheSize = 5, secure = true, authorityDelegationOn = true) {
    return {
      config: {
        authorityDelegationOn,
        happn: {
          secure,
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
