require('../../__fixtures/utils/test_helper').describe({ timeout: 60e3 }, (test) => {
  const path = require('path');
  let server;
  const dbFileName = test.newTempFilename('loki');
  test.tryDeleteTestFilesAfter([dbFileName]);
  let testUser = {
    username: 'happnTestuser@somewhere.com',
    password: 'password',
  };

  let testUser2 = {
    username: 'secondTestuser@somewhere.com',
    password: 'secondPass',
  };

  before('start server', async function () {
    try {
      test.commons.fs.unlinkSync(dbFileName);
    } catch (e) {
      // do nothing
    }
    server = await test.Mesh.create({
      name: 'Server',
      happn: {
        secure: true,
        filename: dbFileName,
        services: {
          security: {
            config: {
              authProviders: {
                second: path.resolve(
                  __dirname,
                  '../../__fixtures/test/integration/security/authentication/workingAuth.js'
                ),
              },
              defaultAuthProvider: 'second',
            },
          },
        },
      },
    });
  });

  before('adds happn authProvider testUser', (done) => {
    server.exchange.security.addUser(testUser, done);
  });

  after('stop server', async function () {
    try {
      test.commons.fs.unlinkSync(dbFileName);
    } catch (e) {
      // do nothing
    }
    if (server) await server.stop({ reconnect: false });
  });

  it('rejects login promise on bad credentials', async () => {
    let client = new test.Mesh.MeshClient();
    try {
      await client.login({
        ...testUser,
        password: 'bad password',
      });
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: Invalid credentials');
    }
  });

  it('logs in correctly using happn3 auth provider', async () => {
    let client = new test.Mesh.MeshClient();
    await client.login({
      ...testUser,
      authType: 'happn',
    });
  });

  it('logs in correctly using second auth provider', async () => {
    let client = new test.Mesh.MeshClient();
    await client.login({
      ...testUser2, //uses default, i.e. 'second' authProvider
    });
  });

  it('fails to log in when using second auth provider for happn3 type user', async () => {
    let client = new test.Mesh.MeshClient();
    try {
      await client.login({
        ...testUser, //uses default, i.e. 'second' authProvider
      });
      throw new Error('SHOULD HAVE THROWN');
    } catch (error) {
      test.expect(error.toString()).to.eql('AccessDenied: Invalid credentials');
    }
  });

  it('fails to log in when using happn3 auth provider for second type user', async () => {
    let client = new test.Mesh.MeshClient();
    try {
      await client.login({
        ...testUser2,
        authType: 'happn',
      });
      throw new Error('Should have thrown');
    } catch (error) {
      test.expect(error.toString()).to.eql('AccessDenied: Invalid credentials');
    }
  });
});
