require('../../__fixtures/utils/test_helper').describe({ timeout: 15e3 }, (test) => {
  var server, adminUser;

  before('start server', function (done) {
    this.timeout(5000);

    test.Mesh.create({
      secure: true,
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

  it('can get stats', function (done) {
    server.exchange.system
      .getStats()
      .then(function (stats) {
        stats.system.happnerVersion.should.equal(require('../../../package.json').version);
      })
      .then(done)
      .catch(done);
  });
  it('can get do a heapdump from a remote admin session', async () => {
    await connectAdminUser();
    await adminUser.exchange.system.gcHeapDump();
  });

  async function connectAdminUser() {
    adminUser = new test.Mesh.MeshClient({ secure: true });
    await adminUser.login({
      username: '_ADMIN',
      password: 'happn',
    });
  }
});
