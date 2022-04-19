const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const minPeers = 1;
const getSeq = require('../_lib/helpers/getSeq');

require('../_lib/test-helper').describe({ timeout: 20e3 }, (test) => {
  let servers, localInstance;

  function localInstanceConfig(seq) {
    var config = baseConfig(seq, minPeers);
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

  beforeEach('start cluster', function (done) {
    this.timeout(20000);
    Promise.all([test.HappnerCluster.create(localInstanceConfig(getSeq.getFirst()))])
      .then(function (_servers) {
        servers = _servers;
        localInstance = servers[0];
        done();
      })
      .catch(done);
  });

  afterEach('stop cluster', function (done) {
    if (!servers) return done();
    stopCluster(servers, done);
  });

  context('_createElement', function () {
    it('does not overwrite components from cluster', function (done) {
      var componentInstance = localInstance._mesh.elements['component'].component.instance;
      var exchange = componentInstance.exchange;

      // both dependencies are from cluster
      test.expect(exchange.dependency1).to.eql({
        __version: '^2.0.0',
        __custom: true,
      });
      test.expect(exchange.dependency2).to.eql({
        __version: '^2.0.0',
        __custom: true,
      });

      localInstance
        ._createElement({
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
        })

        .then(function () {
          // both dependencies are STILL from cluster (not overwritten)
          test.expect(exchange.dependency1).to.eql({
            __version: '^2.0.0',
            __custom: true,
          });
          test.expect(exchange.dependency2).to.eql({
            __version: '^2.0.0',
            __custom: true,
          });
        })

        .then(done)
        .catch(done);
    });
  });

  context('_destroyElement', function () {
    it('does not remove components from cluster', function (done) {
      var componentInstance = localInstance._mesh.elements['component'].component.instance;
      var exchange = componentInstance.exchange;

      // both dependencies are from cluster
      test.expect(exchange.dependency1).to.eql({
        __version: '^2.0.0',
        __custom: true,
      });
      test.expect(exchange.dependency2).to.eql({
        __version: '^2.0.0',
        __custom: true,
      });

      localInstance
        ._destroyElement('dependency1')

        .then(function () {
          // both dependencies are STILL from cluster (not removed)
          test.expect(exchange.dependency1).to.eql({
            __version: '^2.0.0',
            __custom: true,
          });
          test.expect(exchange.dependency2).to.eql({
            __version: '^2.0.0',
            __custom: true,
          });
        })

        .then(done)
        .catch(done);
    });
  });
});
