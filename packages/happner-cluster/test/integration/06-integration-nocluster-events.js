const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');
const stopCluster = require('../_lib/stop-cluster');
const getSeq = require('../_lib/helpers/getSeq');

require('../_lib/test-helper').describe({ timeout: 20e3 }, (test) => {
  let servers, localInstance, remoteInstance;

  function localInstanceConfig(seq) {
    var config = baseConfig(seq, 2);
    config.modules = {
      component1: {
        path: libDir + 'integration-06-component1',
      },
    };
    config.components = {
      component1: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  function remoteInstanceConfig(seq) {
    var config = baseConfig(seq, 2);
    config.modules = {
      component2: {
        path: libDir + 'integration-06-component2',
      },
    };
    config.components = {
      component2: {},
    };
    return config;
  }

  beforeEach('start cluster', function (done) {
    this.timeout(20000);

    Promise.all([
      test.HappnerCluster.create(localInstanceConfig(getSeq.getFirst())),
      test.HappnerCluster.create(remoteInstanceConfig(getSeq.getNext())),
    ])
      .then(function (_servers) {
        servers = _servers;
        localInstance = servers[0];
        remoteInstance = servers[1];
        //wait 5 seconds before starting tests
        setTimeout(done, 5000);
      })
      .catch(done);
  });

  afterEach('stop cluster', function (done) {
    if (!servers) return done();
    stopCluster(servers, done);
  });

  it('gets local and global events where local', function (done) {
    localInstance.exchange.component1
      .awaitEvents()

      .then(function (result) {
        test.expect(result).to.eql({
          'event/global': { some: 'thing1' },
          'event/local': { some: 'thing2' },
        });
      })

      .then(done)
      .catch(done);
  });

  it('gets only global events where remote', function (done) {
    remoteInstance.exchange.component2
      .awaitEvents()

      .then(function (result) {
        test.expect(result).to.eql({
          'event/global': { some: 'thing1' },
        });
      })

      .then(done)
      .catch(done);
  });
});
