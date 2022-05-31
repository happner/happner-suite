require('../../__fixtures/utils/test_helper').describe({ timeout: 25e3 }, (test) => {
  const Happner = require('../../..');
  const Happn3client = require('happn-3').client;
  const client = new Happner.MeshClient({});
  let h3client;
  const path = require('path');
  let server;

  before(async () => {
    server = await Happner.create({
      name: 'MESH_NAME',
      domain: 'DOMAIN',
      modules: {
        blocking_component: {
          path: path.resolve(
            __dirname,
            '../../__fixtures/test/integration/component/blocking-component'
          ),
        },
      },
      components: {
        blocking_component: {},
      },
    });
  });
  it('logs in', async () => {
    await client.login({ username: '_ADMIN', password: 'happn' });
    h3client = await Happn3client.create({ username: '_ADMIN', password: 'happn' });
  });
  // it('fires an event', (done) => {
  //   h3client.on(
  //     `/*/*/*/*`,
  //     async (data) => {
  //       console.log(data);
  //       await h3client.offAll();
  //       done();
  //     },
  //     client.exchange.blocking_component.fireEvent
  //   );
  // });

  it('blocks', (done) => {
    let calls = 0;
    h3client.on(
      `/*/*/*/*`,
      (data) => {
        calls++;
        console.log(data);
        if (calls === 2) done(new Error('called twice'));
      },
      async () => {
        client.exchange.blocking_component.block(5000);
        await test.delay(200); //Same as timeout in blocking component
        await h3client.offAll();
        await h3client.disconnect({ reconnect: false });
        await client.exchange.blocking_component.fireEvent();

        // await client.exchange.blocking_component.fireEvent();

        // console.log('AFTER OFF ALL');
        // try {
        //   await test.delay(100);
        // await h3client.stop();
        // } catch (e) {
        //   if (e) console.log('ERROR ON STOP', e);
        // }
        await test.delay(8000);
        console.log('AFTER DELAY');
        client.exchange.blocking_component.fireEvent();
        console.log('SECOND FIRE');
        await test.delay(1000);
        if (calls === 1) return done(new Error('called once'));
        done();
      }
    );
  });
});
