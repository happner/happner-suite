const commons = require('happn-commons');
const async = commons.async;
const util = commons.utils;
module.exports = class ServiceManager {
  #loaded = [];
  #systemServices = [
    'utils',
    'error',
    'log',
    'data',
    'system',
    'cache',
    'connect',
    'crypto',
    'transport',
    'session',
    'protocol',
    'security',
    'subscription',
    'publisher',
  ];
  constructor() {
    this.stop = util.maybePromisify(this.stop);
    this.initialize = util.maybePromisify(this.initialize);
  }
  initialize(config, happn, callback) {
    this.happn = happn;

    if (!config.services) config.services = {};
    if (!config.services.system) config.services.system = {};
    if (!config.services.system.config) config.services.system.config = {};
    if (config.name) config.services.system.config.name = config.name;

    //these are supplementary services defined in app-land, will always start after system services
    const appServices = Object.keys(config.services).filter((serviceName) => {
      return !this.#systemServices.includes(serviceName);
    });

    async.eachSeries(this.#systemServices, this.#loadService(happn, config), (e) => {
      if (e) return callback(e);
      async.eachSeries(appServices, this.#loadService(happn, config), (e) => {
        if (e) return callback(e);
        this.#initializeServices(happn, this.#loaded, callback); //so that circular dependancies can be met
      });
    });
  }

  stop(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (options.kill) {
      setTimeout(() => {
        this.happn.services.log.error('failed to stop happn, force true');
        process.exit(options.exitCode || 1);
      }, options.wait || 10e3);
    }

    //we stop everything in reverse, that way primus (session service) is able to say goodbye properly before transport service
    async.eachSeries(
      this.#loaded.reverse(),
      (serviceName, stopServiceCB) => {
        const serviceInstance = this.happn.services[serviceName];
        if (serviceInstance.stop) serviceInstance.stop(options, stopServiceCB);
        else stopServiceCB();
      },
      callback
    );
  }
  #loadService(happn, config) {
    return (serviceName, serviceLoaded) => {
      happn.log.$$TRACE('loadService( ' + serviceName);

      if (!config.services[serviceName]) config.services[serviceName] = {};
      if (!config.services[serviceName].path)
        config.services[serviceName].path = './' + serviceName + '/service.js';
      if (!config.services[serviceName].config) config.services[serviceName].config = {};

      var ServiceDefinition, serviceInstance, serviceConfig;

      serviceConfig = config.services[serviceName];

      const doServiceLoaded = (e) => {
        if (e) {
          happn.log.error('Failed to instantiate service: ' + serviceName, e);
          return serviceLoaded(e);
        }
        happn.log.debug(serviceName + ' service loaded.');
        this.#loaded.push(serviceName);
        serviceLoaded();
      };

      if (!serviceConfig.instance) {
        try {
          ServiceDefinition = require(serviceConfig.path);
          serviceInstance = new ServiceDefinition({
            logger: happn.log,
          });
        } catch (e) {
          return doServiceLoaded(e);
        }
      } else serviceInstance = serviceConfig.instance;

      serviceInstance.happn = happn;
      happn.services[serviceName] = serviceInstance;
      if (!serviceConfig.config) serviceConfig.config = {};
      if (config.secure) serviceConfig.config.secure = true;
      serviceInstance.__happnerSettings = serviceConfig;

      doServiceLoaded();
    };
  }
  #initializeServices(happn, serviceNames, callback) {
    async.eachSeries(
      serviceNames,
      (serviceName, serviceInstanceCB) => {
        var serviceInstance = this.happn.services[serviceName];

        if (typeof serviceInstance.initialize === 'function') {
          happn.log.debug(`${serviceName} service initializing`);
          return serviceInstance.initialize(
            serviceInstance.__happnerSettings.config,
            serviceInstanceCB
          );
        }
        serviceInstanceCB();
      },
      callback
    );
  }
};
