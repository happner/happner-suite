require('../../__fixtures/utils/test_helper').describe({ timeout: 30e3 }, (test) => {
  const Mesh = require('../../../lib/mesh');
  const Primus = require('happn-primus-wrapper');

  var serviceInstance;
  var clientInstance;

  it('tests switching the cleanup on, zombie sockets are removed, verbose', async () => {
    await getService(2000, 5000, true);
    zombieSocket();
    zombieSocket();
    zombieSocket();
    zombieSocket();
    await test.delay(2000);
    test
      .expect(
        Object.keys(serviceInstance._mesh.happn.server.services.session.__sessions).length > 1
      )
      .to.be(true);
    await test.delay(15000);
    test
      .expect(Object.keys(serviceInstance._mesh.happn.server.services.session.__sessions).length)
      .to.be(2);
  });

  afterEach('disconnects the client and stops the server', async () => {
    await disconnectZombies();
    await disconnectClient();
    await stopService();
  });

  // in case this is necessary next time
  //test.showOpenHandles(after, 5000);

  const zombies = [];

  function zombieSocket() {
    var Socket = Primus.createSocket({
      manual: true,
    });
    const socket = new Socket('http://127.0.0.1:55000', {
      strategy: 'disconnect,online',
    });
    socket.once('close', destroyZombie(socket));
    zombies.push(socket);
  }

  function destroyZombie(zombie) {
    return () => {
      setTimeout(() => {
        zombie.destroy();
      }, 0);
    };
  }

  function disconnectZombies() {
    for (var i = 0; i < zombies.length; i++) {
      try {
        zombies.pop().end();
      } catch (e) {
        //do nothing
      }
    }
  }

  function disconnectClient() {
    return new Promise((resolve, reject) => {
      if (clientInstance)
        clientInstance.disconnect((e) => {
          if (e) return reject(e);
          resolve();
          clientInstance = null;
        });
      else resolve();
    });
  }

  function stopService() {
    return new Promise((resolve, reject) => {
      if (serviceInstance) {
        serviceInstance.stop((e) => {
          if (e) return reject(e);
          resolve();
          serviceInstance = null;
        });
      } else resolve();
    });
  }

  function getService(cleanupInterval, cleanupThreshold, cleanupVerbose, secureInstance) {
    return new Promise((resolve, reject) => {
      const serviceConfig = {
        secure: secureInstance === undefined ? true : secureInstance,
        services: {
          session: {
            config: {},
          },
        },
      };

      if (cleanupInterval) {
        serviceConfig.services.session.config.unconfiguredSessionCleanup = {
          interval: cleanupInterval, //check every N milliseconds
          threshold: cleanupThreshold || 10e3, //sessions are cleaned up if they remain unconfigured for 10 seconds
          verbose: cleanupVerbose, //cleanups are logged
        };
      }

      Mesh.create(
        {
          happn: serviceConfig,
        },
        function (e, happnInst) {
          if (e) return reject(e);
          serviceInstance = happnInst;
          clientInstance = new Mesh.MeshClient();
          clientInstance
            .login({
              username: '_ADMIN',
              password: 'happn',
            })
            .then(resolve)
            .catch(reject);
        }
      );
    });
  }
});
