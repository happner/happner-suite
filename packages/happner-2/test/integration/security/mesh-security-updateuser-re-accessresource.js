require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  var path = require('path');
  var happner = test.Mesh;
  var libFolder =
    path.resolve(__dirname, '../../..') +
    path.sep +
    ['test', '__fixtures', 'test', 'integration', 'security'].join(path.sep) +
    path.sep;

  let clientPath = path.join(libFolder, 'mesh-security-updateuser-re-accessresource-client.js');
  let serverPath = path.join(libFolder, 'mesh-security-updateuser-re-accessresource-server.js');
  let SERVER_HOST = '127.0.0.1';
  let SERVER_PORT = 8092;
  let CLIENT_PORT = 8093;
  let SERVER_COMPONENT_NAME = 'server';
  let SERVER_MESH_NAME = 'server_mesh_2';
  let DEVICE_KEEPALIVE_INTERVAL = 1000;
  let TUNNEL_HEALTH_INTERVAL = 5000;
  let TUNNEL_SERVICE_ENDPOINT = 'ws://192.168.1.5:8000';
  let clientConfig = {
    name: 'client',
    happn: {
      port: CLIENT_PORT,
      persist: false,
      defaultRoute: 'mem',
    },
    modules: {
      client: {
        path: clientPath,
      },
    },
    components: {
      data: {},
      client: {
        name: 'client',
        moduleName: 'client',
        scope: 'component',
        startMethod: 'start',
        schema: {
          exclusive: false,
          methods: {
            start: {
              type: 'async',
              parameters: [
                {
                  name: 'options',
                  required: true,
                  value: {
                    serverMeshPort: SERVER_PORT,
                    serverMeshHost: SERVER_HOST,
                    serverComponentName: SERVER_COMPONENT_NAME,
                  },
                },
              ],
            },
          },
        },
      },
    },
  };

  var serverConfig = {
    name: SERVER_MESH_NAME,
    happn: {
      secure: true,
      adminPassword: 'password',
      port: SERVER_PORT,
    },
    modules: {
      server: {
        path: serverPath,
      },
    },
    components: {
      data: {},
      server: {
        name: 'server',
        scope: 'component',
        startMethod: 'start',
        schema: {
          exclusive: false,
          methods: {
            start: {
              type: 'sync',
              parameters: [
                {
                  name: 'options',
                  required: true,
                  value: {
                    deviceKeepaliveInterval: DEVICE_KEEPALIVE_INTERVAL,
                    tunnelHealthInterval: TUNNEL_HEALTH_INTERVAL,
                    tunnelServiceEndpoint: TUNNEL_SERVICE_ENDPOINT,
                  },
                },
              ],
            },
          },
        },
      },
    },
  };

  let clientMesh, serverMesh;

  before(function (done) {
    var savedUser = null;
    var savedGroup = null;

    happner
      .create(serverConfig)
      .then(addGroup)
      .then(addUser)
      .then(linkUser)
      .then(createClient)
      .then(saveClient)
      .catch(function (err) {
        done(err);
      });

    function addGroup(server) {
      serverMesh = server;
      return serverMesh.exchange.security.addGroup(getOemAdminGroup());
    }

    function addUser(group) {
      savedGroup = group;
      return serverMesh.exchange.security.addUser(OemUser);
    }

    function linkUser(user) {
      savedUser = user;
      return serverMesh.exchange.security.linkGroup(savedGroup, savedUser);
    }

    function createClient() {
      return happner.create(clientConfig);
    }

    function saveClient(client) {
      clientMesh = client;
      done();
    }
  });

  after('close server mesh', function (done) {
    clientMesh.stop({ reconnect: false }, function (e) {
      if (e) return done(e);
      serverMesh.stop({ reconnect: false }, done);
    });
  });

  it('a client should register a device on the server', function (done) {
    this.timeout(9000);

    var device = {
      device_info: 'someInfo',
    };

    clientMesh.exchange.client.registerDevice(OemUser, device, function (err) {
      test.expect(err).to.not.exist;
      clientMesh.exchange.client.requestSomethingSpecial('some_data', function (err, data) {
        test.expect(err).to.not.exist;
        data.should.eql('success');
        device = {
          device_info: 'some New Info',
        };
        clientMesh.exchange.client.registerDevice(OemUser, device, function (err) {
          test.expect(err).to.not.exist;
          clientMesh.exchange.client.requestSomethingSpecial('some_data', function (err, data) {
            test.expect(err).to.not.exist;
            data.should.eql('success');
            done();
          });
        });
      });
    });
  });
  function getOemAdminGroup() {
    var regesterDeviceMethodPath =
      '/' + SERVER_MESH_NAME + '/' + SERVER_COMPONENT_NAME + '/registerDevice';
    var oemAdminGroup = {
      name: 'OEM Admin',
      permissions: {
        methods: {},
      },
    };
    oemAdminGroup.permissions.methods[regesterDeviceMethodPath] = { authorized: true };
    return oemAdminGroup;
  }

  var OemUser = {
    username: 'user',
    password: 'password',
    customData: {
      oem: 'OEM A',
      company: 'Enterprise X',
    },
  };
});
