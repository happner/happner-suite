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

  it('can change log levels', async function () {
    let logger = require('happn-logger');
    logger.config.log = test.sinon.spy();
    server._mesh.happn.server.log.debug('shouldnt log');
    server._mesh.happn.server.log.info('should log');
    test.expect(logger.config.log.neverCalledWith('debug')).to.be(true);
    test.expect(logger.config.log.neverCalledWith('info')).to.be(false);
    server.exchange.system.setLogLevel('debug');
    await test.delay(1000);
    server._mesh.happn.server.log.debug('should log');
    test.expect(logger.config.log.neverCalledWith('debug')).to.be(false);
    test
      .expect(logger.config.log.calledWith('debug', 'MESH_NAME', 'HappnServer', 'should log'))
      .to.be(true);
  });
});
