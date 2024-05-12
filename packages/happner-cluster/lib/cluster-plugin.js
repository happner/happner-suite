const HappnerClient = require('happner-client');

module.exports = function (clusterConfig) {
  return function (mesh, logger) {
    clusterConfig = clusterConfig || {};

    let opts = {
      requestTimeout: clusterConfig.requestTimeout,
      responseTimeout: clusterConfig.responseTimeout,
      logger: logger,
    };

    let client = new HappnerClient(opts);
    mesh._mesh.clusterClient = client;
    return {
      broker: null,
      start: function (callback) {
        let brokeredModels = {};
        try {
          Object.keys(mesh._mesh.elements).forEach((componentName) => {
            let module = mesh._mesh.elements[componentName].module;
            let component = mesh._mesh.elements[componentName].component;
            let $happn = component.instance;
            let modulePackage = module.package || {};
            // package dependencies trump component configured dependencies
            let dependencies = modulePackage.happner
              ? modulePackage.happner.dependencies[componentName] //package.happner exists
                ? modulePackage.happner.dependencies[componentName] //package.happner.dependencies[componentName] exists
                : component.config.dependencies //no package.happner.dependencies[componentName]
              : component.config.dependencies; //no package.happner

            let brokeredDependencies =
              modulePackage.happner &&
              modulePackage.happner.dependencies &&
              modulePackage.happner.dependencies.$broker;

            brokeredDependencies =
              brokeredDependencies ||
              (component.config &&
                component.config.dependencies &&
                component.config.dependencies.$broker);

            if (
              (!dependencies || Object.keys(dependencies).length === 0) &&
              (!brokeredDependencies || Object.keys(brokeredDependencies).length === 0)
            ) {
              if (['security', 'system', 'data', 'rest'].includes($happn.config.moduleName)) {
                return;
              }
              return client.construct({}, $happn);
            }

            component.dependencies = dependencies;

            if (brokeredDependencies) {
              mesh._mesh.config.brokered = true;
              logger.info(`setup brokered configuration - updated mesh config...`);
              brokeredModels[componentName] = {
                package: brokeredDependencies,
                $happn: $happn,
              };
              client.construct(brokeredDependencies, $happn);
              return;
            }
            // amend $happn with model
            client.construct(dependencies, $happn);
          });

          // backward compatibility hack, some people use this old path for _mesh level access
          mesh._mesh.happn.server.server = mesh._mesh.happn.server;

          // mount .peers in orchestrator
          client.mount(mesh._mesh.happn.server);

          if (Object.keys(brokeredModels).length > 0) {
            this.brokerage = require('./brokerage').create(
              brokeredModels,
              mesh,
              client,
              logger,
              clusterConfig
            );
            this.brokerWebProxy = require('./broker-web-proxy').create(mesh, logger);
            return this.brokerage.inject(function (injectError) {
              callback(injectError);
            });
          }
          callback();
        } catch (e) {
          callback(e);
        }
      },

      stop: function (callback) {
        if (client) {
          client.unmount();
          client = undefined;
        }
        callback();
      },
    };
  };
};
