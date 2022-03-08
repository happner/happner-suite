class TestInstanceClass {
  static create() {
    return new TestInstanceClass();
  }
  async testMethod(_arg1, $happn) {
    return typeof $happn.exchange.test.testMethod === 'function';
  }
  async testMethodArgs($origin, arg1, $happn, arg2) {
    arg1 = arg1 || 0;
    arg2 = arg2 || 0;
    $happn.emit('called with and by', [arg1, arg2, $origin]);
    return arg1 + arg2;
  }
}
const Happner = require('../../..');
const LightClient = require('happner-client').Light;

require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  let server;
  before(createServer);
  after(destroyServer);

  it('test method is a function, test various argument scenarios', async () => {
    let client = new Happner.MeshClient({ secure: true });
    await client.login({
      username: '_ADMIN',
      password: 'happn',
    });
    test.expect(typeof client.exchange.test.testMethod).to.equal('function');
    const events = [];
    await client.event.test.on('called with and by', (data) => {
      events.push(data.value);
    });
    test.expect(await client.exchange.test.testMethodArgs(1, 2)).to.equal(3);
    test.expect(await client.exchange.test.testMethodArgs()).to.equal(0);
    test.expect(await client.exchange.test.testMethodArgs(1)).to.equal(1);
    await test.delay(2000);
    test.expect(events[0][0]).to.be(1);
    test.expect(events[0][1]).to.be(2);
    test.expect(events[0][2].username).to.be('_ADMIN');
    client.disconnect(() => {});
  });

  it('can call the test method light client missing argument', async () => {
    let client = new LightClient({ domain: 'MESH_NAME', secure: true });
    await client.connect({ username: '_ADMIN', password: 'happn' });
    test
      .expect(
        await client.exchange.$call({
          component: 'test',
          method: 'testMethod',
          arguments: [],
        })
      )
      .to.equal(true);
    client.disconnect(() => {});
  });

  async function destroyServer() {
    if (server) await server.stop({ reconnect: false });
  }

  function createServer() {
    return new Promise((resolve, reject) => {
      Happner.create(
        {
          secure: true,
          name: 'MESH_NAME',
          modules: {
            test: {
              instance: TestInstanceClass.create()
            }
          },
          components: {
            test: {}
          }
        },
        (e, instance) => {
          if (e) return reject(e);
          server = instance;
          resolve();
        }
      );
    });
  }
});
