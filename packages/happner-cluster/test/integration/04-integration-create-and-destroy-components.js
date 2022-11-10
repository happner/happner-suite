const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');

require('../_lib/test-helper').describe({ timeout: 20e3 }, (test) => {
  let localInstance;

  beforeEach('start cluster', async function () {
    localInstance = await test.HappnerCluster.create(localInstanceConfig(0));
  });

  afterEach('stop cluster', async function () {
    if (localInstance) await stopCluster([localInstance]);
  });

  context('_createElement', function () {
    it('does not overwrite components from cluster', async function () {
      let componentInstance = localInstance._mesh.elements['component'].component.instance;
      let exchange = componentInstance.exchange;

      // both dependencies are from cluster
      test.expect(exchange.dependency1).to.eql({
        __version: '^2.0.0',
        __custom: true,
      });
      test.expect(exchange.dependency2).to.eql({
        __version: '^2.0.0',
        __custom: true,
      });

      await localInstance._createElement({
        module: {
          name: 'dependency2',
          config: {
            instance: {},
          },
        },
        component: {
          name: 'dependency2',
          config: {},
        },
      });

      // both dependencies are STILL from cluster (not overwritten)
      test.expect(exchange.dependency1).to.eql({
        __version: '^2.0.0',
        __custom: true,
      });
      test.expect(exchange.dependency2).to.eql({
        __version: '^2.0.0',
        __custom: true,
      });
    });
  });

  context('_destroyElement', function () {
    it('does not remove components from cluster', async function () {
      let componentInstance = localInstance._mesh.elements['component'].component.instance;
      let exchange = componentInstance.exchange;

      // both dependencies are from cluster
      test.expect(exchange.dependency1).to.eql({
        __version: '^2.0.0',
        __custom: true,
      });
      test.expect(exchange.dependency2).to.eql({
        __version: '^2.0.0',
        __custom: true,
      });

      await localInstance._destroyElement('dependency1');

      // both dependencies are STILL from cluster (not removed)
      test.expect(exchange.dependency1).to.eql({
        __version: '^2.0.0',
        __custom: true,
      });
      test.expect(exchange.dependency2).to.eql({
        __version: '^2.0.0',
        __custom: true,
      });
    });
  });

  function localInstanceConfig(seq) {
    let config = baseConfig(seq, 1);
    config.modules = {
      dependency1: {
        instance: {},
      },
      component: {
        path: libDir + 'integration-04-component',
      },
    };
    config.components = {
      dependency1: {},
      component: {},
    };
    return config;
  }
});
