require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3, only: true }, (test) => {
  const adminClients = {};
  const clients = [];
  const meshes = {};

  before('creates mesh with regex cache mask on', createTestMesh(12358, true));
  before('creates mesh with regex cache mask off', createTestMesh(12359, false));

  before('connects admin user cache mask on', connectClient(12358, '_ADMIN', 'happn'));
  before('connects admin user cache mask off', connectClient(12359, '_ADMIN', 'happn'));

  before('creates test user with regex cache mask on', createTestUser(12358));
  before('creates test user with regex cache mask off', createTestUser(12359));

  it('verifies the authorization cache', verifyAuthCache(12358, true));
  it('verifies the authorization cache, negative test', verifyAuthCache(12359, false));

  after('disconnects test clients', disconnectClients);
  after('tears down test meshes', tearDownMeshes);

  function connectClient(port, username, password) {
    return async () => {
      const user = new test.Mesh.MeshClient({ port });
      await user.login({
        username,
        password,
      });
      if (username === '_ADMIN') adminClients[port] = user;
      clients.push(user);
      return user;
    };
  }

  function createTestUser(port) {
    return async () => {
      const adminUser = adminClients[port];
      const testGroupUser = {
        name: `testGroup`,
        permissions: {
          methods: {
            [`/test-mesh-mask-on-${port}/testComponent/testMethod`]: { authorized: true },
          },
        },
      };
      await adminUser.exchange.security.upsertGroup(testGroupUser);
      const upsertedUser = await adminUser.exchange.security.upsertUser({
        username: `testUser`,
        password: 'password',
      });
      await adminUser.exchange.security.linkGroup(`testGroup`, upsertedUser.username);
    };
  }

  function createTestMesh(port, regexCacheMaskOn) {
    return async () => {
      const happn = test._.set(
        {
          services: {
            cache: {
              config: {
                overrides: {
                  checkpoint_cache_authorization: {
                    max: 10,
                  },
                },
              },
            },
          },
        },
        'services.cache.config.overrides.checkpoint_cache_authorization.keyTransformers',
        regexCacheMaskOn ? undefined : false
      );

      meshes[port] = await test.Mesh.create({
        name: `test-mesh-mask-on-${port}`,
        port,
        secure: true,
        happn,
        modules: {
          testComponent: {
            instance: {
              testMethod: async function (param1) {
                return param1;
              },
            },
          },
        },
        components: {
          testComponent: {},
        },
      });
    };
  }

  function verifyAuthCache(port, checkCacheSizeReduced) {
    return async () => {
      const client = await connectClient(port, 'testUser', 'password')();
      await client.exchange.testComponent.testMethod();
      await client.exchange.testComponent.testMethod();
      await client.exchange.testComponent.testMethod();

      const cache = meshes[port]._mesh.happn.server.services.cache.getCache(
        'checkpoint_cache_authorization'
      );

      test
        .expect(
          cache.instance.keys().filter((key) => {
            return (
              key.indexOf(
                // note: it is the internal admin client that is doing the set on responses
                `/_exchange/responses/test-mesh-mask-on-${port}/testComponent/testMethod/${client.data.session.id}`
              ) > -1
            );
          }).length
        )
        .to.be(checkCacheSizeReduced ? 2 : 4); // note: we have an extra cache item for both, as one of them is an "on" made by the client
      // ensure the intentional override is not overridden
      test.expect(cache.instance.opts.max).to.be(10);
    };
  }

  async function disconnectClients() {
    await Promise.all(
      clients.map((client) => {
        return client.disconnect();
      })
    );
  }

  async function tearDownMeshes() {
    await Promise.all(
      Object.values(meshes).map((mesh) => {
        return mesh.stop();
      })
    );
  }
});
