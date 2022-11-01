require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  let mesh;
  const Mesh = test.Mesh;
  const adminClient = new Mesh.MeshClient({ secure: true, port: 8003 });
  const test_id = test.newid();
  const DB_NAME = 'test-happner-2-user-group-management';
  const COLL_NAME = 'test-happner-2-user-group-management-coll';
  const upsertedGroups = [];

  before('should clear the mongo collection', async () => {
    let dropMongoDb = require('../../__fixtures/utils/drop-mongo-db');
    await dropMongoDb(DB_NAME);
  });

  beforeEach(function (done) {
    mesh = this.mesh = new Mesh();
    mesh.initialize(
      {
        name: 'user-management',
        happn: {
          secure: true,
          adminPassword: test_id,
          port: 8003,
          services: {
            data: {
              config: {
                autoUpdateDBVersion: true,
                datastores: [
                  {
                    name: 'mongo',
                    provider: 'happn-db-provider-mongo',
                    isDefault: true,
                    settings: {
                      database: DB_NAME,
                      collection: COLL_NAME,
                    },
                  },
                ],
              },
            },
          },
        },
      },
      function (err) {
        if (err) return done(err);
        const groupService = mesh._mesh.happn.server.services.security.groups;
        const oldUpsertGroupMethod = groupService.upsertGroup;
        groupService.upsertGroup = function (group, options, callback) {
          upsertedGroups.push(group);
          return oldUpsertGroupMethod.call(groupService, group, options, callback);
        };
        mesh.start(function (err) {
          if (err) {
            return done(err);
          }
          var credentials = {
            username: '_ADMIN',
            password: test_id,
          };
          adminClient.login(credentials).then(done).catch(done);
        });
      }
    );
  });

  afterEach(function (done) {
    adminClient.disconnect(() => {
      mesh.stop({ reconnect: false }, done);
    });
  });

  it('checks the mesh adm and mesh groups have been created', async () => {
    const admGroup = await adminClient.exchange.security.getGroup('_MESH_ADM');
    const gstGroup = await adminClient.exchange.security.getGroup('_MESH_GST');

    test.expect(admGroup).to.not.be(null);
    test.expect(gstGroup).to.not.be(null);

    test.expect(upsertedGroups.length).to.be(3);

    test.delay(2000);
  });

  it('checks the mesh adm and mesh groups have been recreated', async () => {
    const admGroup = await adminClient.exchange.security.getGroup('_MESH_ADM');
    const gstGroup = await adminClient.exchange.security.getGroup('_MESH_GST');

    test.expect(admGroup).to.not.be(null);
    test.expect(gstGroup).to.not.be(null);

    test.expect(upsertedGroups.length).to.be(6);
    //ensure we are able to add a user after this, and it is part of the _MESH_GST group
    await adminClient.exchange.security.addUser({
      username: 'test',
      password: 'test',
    });

    const addedUser = await adminClient.exchange.security.getUser('test');
    test.expect(addedUser.groups).to.eql({ _MESH_GST: { data: {} } });
  });
});
