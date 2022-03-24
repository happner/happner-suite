require('../../__fixtures/utils/test_helper').describe({ timeout: 15e3 }, (test) => {
  var server;
  before('start server', function (done) {
    this.timeout(5000);

    test.Mesh.create({
      name: 'MESH_NAME',
      happn: {},
      modules: {},
      components: {},
    })
      .then(function (_server) {
        server = _server;
        done();
      })
      .catch(done);
  });

  after('stop server', function (done) {
    if (!server) return done();
    server.stop({ reconnect: false }, done);
  });

  it('can change log levels and listen on log events', async function () {
    const logData = [];
    await server.event.system.on('system/log/*', (log) => {
      logData.push(log);
    });
    let logger = require('happn-logger');
    let oldLevel = logger.config.logLevel;
    logger.config.log = test.sinon.spy(logger.config, 'log');
    await server.exchange.system.setLogLevel('info'); //Log may be at some other level due to previous tests.
    server._mesh.happn.server.log.debug('shouldnt log');
    server._mesh.happn.server.log.info('should log');
    test.expect(logger.config.log.neverCalledWith('debug')).to.be(true);
    test.expect(logger.config.log.neverCalledWith('info')).to.be(false);
    await server.exchange.system.setLogLevel('debug');
    server._mesh.happn.server.log.debug('should log');
    test.expect(logger.config.log.neverCalledWith('debug')).to.be(false);
    test
      .expect(logger.config.log.calledWith('debug', 'MESH_NAME', 'HappnServer', 'should log'))
      .to.be(true);
    await server.exchange.system.setLogLevel(oldLevel);
    await test.delay(1e3);
    test.expect(logData.map((item) => test.commons._.pick(item, ['level', 'additional']))).to.eql([
      { level: 'info', additional: 'should log' },
      { level: 'debug', additional: 'should log' },
    ]);
  });
});
