require('../../__fixtures/utils/test_helper').describe({ timeout: 30e3 }, (test) => {
  it('configures default datastores', () => {
    const Happn = require('../../../lib/system/happn');
    const happn = new Happn();
    happn.log = require('../../__fixtures/utils/mock-logger').create();

    let testScenario1 = happn.__initializeBaseConfig(scenario1());
    let testScenario2 = happn.__initializeBaseConfig(scenario2());
    let testScenario3 = happn.__initializeBaseConfig(scenario3());
    let testScenario4 = happn.__initializeBaseConfig(scenario4());

    let config = happn.__initializeDbConfig(testScenario1);
    test.expect(happn.log.info.firstCall).to.be(null);
    test
      .expect(config.happn.services.data.config.datastores)
      .to.eql(testScenario1.happn.services.data.config.datastores);

    config = happn.__initializeDbConfig(testScenario2);
    test.expect(config.happn.services.data.config.datastores).to.eql([
      {
        name: 'persist',
        isDefault: true,
        settings: { filename: '/Users/simonbishop/.happn/data/test-db.loki' },
        patterns: ['/_SYSTEM/*'],
      },
      { name: 'mem', isDefault: false, patterns: [] },
    ]);
    test
      .expect(happn.log.info.firstCall.args)
      .to.eql(['persisting to default file %s', '/Users/simonbishop/.happn/data/test-db.loki']);
    config = happn.__initializeDbConfig(testScenario3);
    test.expect(config.happn.services.data.config.datastores).to.eql([
      {
        name: 'persist',
        isDefault: true,
        settings: { filename: '/Users/simonbishop/.happn/data/test-db.loki' },
        patterns: ['/_SYSTEM/*'],
      },
      { name: 'mem', isDefault: false, patterns: [] },
    ]);
    config = happn.__initializeDbConfig(testScenario4);
    test.expect(config.happn.services.data.config.datastores).to.eql(undefined);
  });

  function scenario1() {
    return {
      name: 'test-db',
      happn: {
        persist: true,
        services: {
          data: {
            config: {
              datastores: [
                {
                  name: 'persist',
                  provider: 'happn-db-provider-nedb',
                  isDefault: true,
                  settings: {
                    filename: '/home/cc/dev/stash/device-registration-components/test/ut_9_s.nedb',
                  },
                },
              ],
            },
          },
        },
      },
    };
  }
  function scenario2() {
    return {
      persist: true,
      name: 'test-db',
      happn: {},
    };
  }
  function scenario3() {
    return {
      name: 'test-db',
      happn: {
        persist: true,
      },
    };
  }
  function scenario4() {
    return {
      name: 'test-db',
    };
  }
});
