var Configurator = require('../../../lib/configurators/database-configurator');
require('../../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
  let mongoDefaultConfig = {
    name: 'mongo',
    provider: 'happn-db-provider-mongo',
    isDefault: true,
    settings: {
      collection: 'happn-cluster',
      database: 'happn-cluster',
      url: 'mongodb://127.0.0.1:27017',
    },
  };
  it('Can create a DB configurator (constructor)', () => {
    let configurator = new Configurator();
    test.expect(configurator).to.be.ok();
  });

  it('Can create a DB configurator (create method)', () => {
    let configurator = Configurator.create();
    test.expect(configurator).to.be.ok();
  });

  it('Tests the addMongoDb method', () => {
    let configurator = Configurator.create();
    let config = { datastores: [] };
    configurator.addMongoDb(config);
    test.expect(config.datastores[0]).to.eql(mongoDefaultConfig);
    config = { datastores: [{ some: 'datastore' }] };
    configurator.addMongoDb(config);
    test.expect(config.datastores[0]).to.eql({ some: 'datastore' });
    test.expect(config.datastores[1]).to.eql(mongoDefaultConfig);
  });

  it('Tests that configurator will add a default mongodb datastore if there are no datastores configured', () => {
    let configurator = Configurator.create();
    let dbConfig = { datastores: [] }; //This is created by default in cluster.js, so will always be present
    let config = { services: { data: { config: dbConfig } } };
    configurator.configure(config);
    test.expect(dbConfig.datastores.length).to.be(1);
    test.expect(dbConfig.datastores[0]).to.eql(mongoDefaultConfig);
  });

  it('Tests that configurator will add a default mongodb datastore if there are no datastores with provider happn-db-provider-mongo configured ', () => {
    let configurator = Configurator.create();
    let dbConfig = {
      datastores: [
        { some: 'datastore', provider: 'happn-db-provider-loki' },
        { another: 'datastore', provider: 'happn-db-provider-nedb' },
      ],
    };
    let dsClone = [...dbConfig.datastores];
    let config = { services: { data: { config: dbConfig } } };
    configurator.configure(config);
    test.expect(dbConfig.datastores.length).to.be(3);
    test.expect(dbConfig.datastores[0]).to.eql(dsClone[0]);
    test.expect(dbConfig.datastores[1]).to.eql(dsClone[1]);
    test.expect(dbConfig.datastores[2]).to.eql(mongoDefaultConfig);

  });
  it('Tests that configurator wont add a datastore if there is already one with provider happn-db-provider-mongo', () => {
    let configurator = Configurator.create();
    let dbConfig = { datastores: [{ some: 'datastore', provider: 'happn-db-provider-mongo' }] };
    let config = { services: { data: { config: dbConfig } } };
    configurator.configure(config);
    test.expect(dbConfig.datastores.length).to.be(1);
    test
      .expect(dbConfig.datastores[0])
      .to.eql({ some: 'datastore', provider: 'happn-db-provider-mongo' });
  });
});
