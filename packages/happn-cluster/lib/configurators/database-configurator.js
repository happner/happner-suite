module.exports = class DatabaseConfigurator {
  static create() {
    return new DatabaseConfigurator();
  }
  configure(config) {
    if (config.services.data.config.datastores.length > 0) {
      // check that a mongodb store is present
      var present = false;
      config.services.data.config.datastores.forEach(function (ds) {
        if (ds.provider === 'happn-db-provider-mongo') {
          present = true;
        }
      });
      if (!present) this.addMongoDb(config.services.data.config);
    } else {
      this.addMongoDb(config.services.data.config);
    }
    return config;
  }
  addMongoDb(dataConfig) {
    dataConfig.datastores.push({
      name: 'mongo',
      provider: 'happn-db-provider-mongo',
      isDefault: true,
      settings: {
        collection: 'happn-cluster',
        database: 'happn-cluster',
        url: 'mongodb://127.0.0.1:27017',
      },
    });
  }
};
