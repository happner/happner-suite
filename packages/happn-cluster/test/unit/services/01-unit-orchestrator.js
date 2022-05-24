var Orchestrator = require('../../../lib/services/orchestrator');
var MockHappn = require('../../mocks/mock-happn');
var MockHappnClient = require('../../mocks/mock-happn-client');
var MockSession = require('../../mocks/mock-session');
var mockOpts = require('../../mocks/mock-opts');
const { config } = require('happn-logger/lib/logger');
var address = require('../../../lib/utils/get-address')()();

require('../../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
  before(function () {
    this.logLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'off';
  });

  context('initialise', function () {
    it('subscribes to happn server connection events', function (done) {
      var o = new Orchestrator(mockOpts);
      o.happn = new MockHappn('http', 9000);
      o.__onConnectionFrom = test.sinon.spy();
      o.__onDisconnectionFrom = test.sinon.spy();

      o.initialize({}, function (e) {
        if (e) return done(e);

        MockSession.instance._events.authentic();
        test.expect(o.__onConnectionFrom.calledOnce).to.be(true);
        test.expect(o.__onConnectionFrom.alwaysCalledOn(o)).to.be(true);

        MockSession.instance._events.disconnect();
        test.expect(o.__onDisconnectionFrom.calledOnce).to.be(true);
        test.expect(o.__onDisconnectionFrom.alwaysCalledOn(o)).to.be(true);
        done();
      });
    });

    it('defaults config', function (done) {
      var o = new Orchestrator(mockOpts);
      o.happn = new MockHappn('http', 9000);

      o.initialize({}, function (e) {
        if (e) return done(e);

        test.expect(o.config).to.eql({
          replicate: ['*'],
          serviceName: 'happn-cluster-node',
          deployment: 'Test-Deploy',
          clusterName: 'happn-cluster',
          cluster: { 'happn-cluster-node': 1 },
          timing: {
            memberRefresh: 5000,
            keepAlive: 5000,
            keepAliveThreshold: 6000,
            healthReport: 10000,
          },
        });

        done();
      });
    });

    it('can assign all config', function (done) {
      var o = new Orchestrator(mockOpts);
      o.happn = new MockHappn('http', 9000);
      o.initialize(
        {
          minimumPeers: 3,
          replicate: [],
        },
        (e) => {
          if (e) return done(e);
          test.expect(o.config).to.eql({
            minimumPeers: 3,
            replicate: ['/__REPLICATE'],
            serviceName: 'happn-cluster-node',
            deployment: 'Test-Deploy',
            clusterName: 'happn-cluster',
            cluster: { 'happn-cluster-node': 3 },
            timing: {
              memberRefresh: 5000,
              keepAlive: 5000,
              keepAliveThreshold: 6000,
              healthReport: 10000,
            },
          });
          done();
        }
      );
    });

    it('can assign all config (2 - with config.cluster)', function (done) {
      var o = new Orchestrator(mockOpts);
      o.happn = new MockHappn('http', 9000);

      o.initialize(
        {
          replicate: [],
          serviceName: 'service1',
          deployment: 'Another-Deployment',
          clusterName: 'another-cluster',
          cluster: {
            service1: 3,
            service2: 5,
          },
          stabiliseTimeout: 8000,
        },
        (e) => {
          if (e) return done(e);

          test.expect(o.config).to.eql({
            replicate: ['/__REPLICATE'],
            serviceName: 'service1',
            deployment: 'Another-Deployment',
            clusterName: 'another-cluster',
            stabiliseTimeout: 8000,
            cluster: {
              service1: 3,
              service2: 5,
            },
            timing: {
              memberRefresh: 5000,
              keepAlive: 5000,
              keepAliveThreshold: 6000,
              healthReport: 10000,
              stabiliseTimeout: 8000,
            },
          });
          done();
        }
      );
    });

    context('reduce replication paths', function () {
      var o;

      beforeEach(function () {
        o = new Orchestrator(mockOpts);
        o.happn = new MockHappn('http', 9000);
      });

      it('removes duplicate paths', function (done) {
        o.initialize(
          {
            replicate: ['/same/path', '/same/path'],
          },
          function (e) {
            if (e) return done(e);

            test.expect(o.config.replicate).to.eql(['/same/path', '/__REPLICATE']);
            done();
          }
        );
      });

      it('collapses simple wildcard paths (forward)', function (done) {
        o.initialize(
          {
            replicate: ['/same/*', '/same/path'],
          },
          function (e) {
            if (e) return done(e);

            test.expect(o.config.replicate).to.eql(['/same/*', '/__REPLICATE']);
            done();
          }
        );
      });

      it('collapses simple wildcard paths (backwards)', function (done) {
        o.initialize(
          {
            replicate: ['/same/path', '/same/*'],
          },
          function (e) {
            if (e) return done(e);

            test.expect(o.config.replicate).to.eql(['/same/*', '/__REPLICATE']);
            done();
          }
        );
      });

      it('collapses complicated wildcard paths (forward)', function (done) {
        o.initialize(
          {
            replicate: ['/same/*/with/*/more', '/same/path', '/same/path/with/some/more'],
          },
          function (e) {
            if (e) return done(e);

            test
              .expect(o.config.replicate)
              .to.eql(['/same/*/with/*/more', '/same/path', '/__REPLICATE']);
            done();
          }
        );
      });

      it('collapses complicated wildcard paths (reverse)', function (done) {
        o.initialize(
          {
            replicate: ['/same/path/with/some/more', '/same/*/with/*/more', '/same/path/*'],
          },
          function (e) {
            if (e) return done(e);

            test
              .expect(o.config.replicate.sort())
              .to.eql(['/__REPLICATE', '/same/*/with/*/more', '/same/path/*']);
            done();
          }
        );
      });

      it('does the obvious', function (done) {
        o.initialize(
          {
            replicate: ['/same/*/with/some/more', '/same/path/with/*/more', '/same/path', '/*'],
          },
          function (e) {
            if (e) return done(e);

            test
              .expect(o.config.replicate.sort())
              .to.eql(
                ['/same/path', '/same/*/with/some/more', '/same/path/with/*/more', '/*'].sort()
              );
            done();
          }
        );
      });

      it('is idiot proof', function (done) {
        o.initialize(
          {
            replicate: [
              '/*/*/*/*/*/*/*/*/*',
              '/*/*/*/*/*/*/*/*',
              '/*/*/*/*/*/*/*',
              '/*/*/*/*/*/*',
              '/*/*/*/*/*',
              '/*/*/*/*',
              '/*/*/*',
              '/*/*',
              '/*',
            ],
          },
          function (e) {
            if (e) return done(e);

            test
              .expect(o.config.replicate)
              .to.eql([
                '/*/*/*/*/*/*/*/*/*',
                '/*/*/*/*/*/*/*/*',
                '/*/*/*/*/*/*/*',
                '/*/*/*/*/*/*',
                '/*/*/*/*/*',
                '/*/*/*/*',
                '/*/*/*',
                '/*/*',
                '/*',
              ]);
            done();
          }
        );
      });
    });
  });

  context('stop', function () {
    it('stops all members', function (done) {
      var o = new Orchestrator(mockOpts);
      o.happn = new MockHappn('http', 9000);

      var stopped = 0;

      var stop = function () {
        return new Promise(function (resolve) {
          stopped++;
          resolve();
        });
      };

      o.initialize({}, function (e) {
        if (e) return done(e);
        o.registry['happn-cluster-node'].members = {
          memberId1: {
            stop: stop,
          },
          memberId2: {
            stop: stop,
          },
          memberId3: {
            stop: stop,
          },
        };
        o.stop(function (e) {
          if (e) return done(e);
          test.expect(stopped).to.equal(3);
          done();
        });
      });
    });
  });

  context('start', function () {
    var o;

    beforeEach(function (done) {
      o = new Orchestrator(mockOpts);
      o.happn = new MockHappn('http', 9000);
      o.HappnClient = MockHappnClient;
      o.startIntervals = () => {}; //Don't want to start intervals for these tests, requires too much mocking
      o.initialize({}, done);
    });

    it('starts loginConfig for inter-cluster happn client logins', async function () {
      await o.start();
      test.expect(o.loginConfig).to.eql({
        info: {
          name: 'local-happn-instance',
          clusterName: 'happn-cluster',
          serviceName: 'happn-cluster-node',
          endpoint: address + ':9000',
        },
      });
    });

    it('uses alternative host in url if announceHost is defined', function (done) {
      o.announceHost = 'alternate-host-or-ip';
      o.start()
        .then(function () {
          test.expect(o.loginConfig).to.eql({
            info: {
              name: 'local-happn-instance',
              clusterName: 'happn-cluster',
              serviceName: 'happn-cluster-node',
              endpoint: 'alternate-host-or-ip:9000',
            },
          });

          done();
        })
        .catch(done);
    });

    it('connects intra-process client to self', function (done) {
      o.start()

        .then(function () {
          test.expect(MockHappnClient.getLastLoginConfig()).to.eql({
            context: {},
            info: {
              name: 'local-happn-instance',
              serviceName: 'happn-cluster-node',
              endpoint: address + ':9000',
            },
          });

          done();
        })
        .catch(done);
    });
  });

  context('stabilised', function () {
    var o;

    beforeEach(function () {
      MockHappnClient.instances = {};
      MockHappn.eventHandlers = {};
    });

    beforeEach(function (done) {
      let minimumPeers =
        this.currentTest.title === 'immediately stabilises with only self as member' ? 1 : 2;
      o = new Orchestrator(mockOpts);
      o.happn = new MockHappn('http', 9000);
      o.HappnClient = MockHappnClient;
      o.initialize({ timing: { keepAlive: 200, memberRefresh: 200 }, minimumPeers }, function (e) {
        if (e) return done(e);
        o.start().then(done).catch(done);
      });
    });
    this.afterEach(async () => {
      o.happn.services.data.storage = {};
      await o.stop();
    });

    context('first member in cluster', function () {
      it('immediately stabilises with only self as member', function (done) {
        // o.registry['happn-cluster-node'].expeccted = 1; //Switch to only expect 1 peer
        o.stabilised()
          .then(function () {
            test.expect(Object.keys(o.peers)).to.eql(['local-happn-instance']);
            test.expect(o.peers.__self).to.equal(o.peers['local-happn-instance']);
            done();
          })
          .catch(done);
      });

      it('pends stabilise if minimumPeers is set', async function () {
        var stable = false;

        o.stabilised(function () {
          stable = true;
        });
        await test.delay(200);

        // stabilised() has not resolved
        test.expect(stable).to.equal(false);

        // new member discovered
        o.happn.services.data.upsert('/_SYSTEM/DEPLOYMENT/10.0.0.1:55001 ', {
          endpoint: '10.0.0.1:55001',
          service: 'happn-cluster-node',
          name: '10-0-0-1_55001',
        });
        await test.delay(2500);
        // member record was added
        test.expect(o.members['10.0.0.1:55001']).to.not.be(undefined); // Endpoint as key

        // peer record was not added
        test.expect(o.peers['10.0.0.1:55001']).to.be(undefined);
        // wait for member login to remote
        await test.delay(300);
        // member logged in to remote
        test.expect(MockHappnClient.instances['10-0-0-1_55001']).to.not.be(undefined); // remote happn.name as key

        // member state is correct
        test.expect(o.members['10.0.0.1:55001'].connectingTo).to.equal(false);
        test.expect(o.members['10.0.0.1:55001'].connectedTo).to.equal(true);
        // test.expect(o.members['10.0.0.1:55001'].connectedFrom).to.equal(false); // <---- pending login back to us
        test.expect(o.members['10.0.0.1:55001'].subscribedTo).to.equal(true);

        // THEN... peer logs back into us
        MockSession.instance.emit('authentic', {
          info: {
            name: '10-0-0-1_55001',
            clusterName: 'happn-cluster',
            endpoint: '10.0.0.1:55001',
            url: 'http://10.0.0.1:55001',
            serviceName: 'happn-cluster-node',
          },
        });

        test.expect(o.members['10.0.0.1:55001'].connectedFrom).to.equal(true); // <---- pending login done

        // added as peer
        test.expect(o.peers['10-0-0-1_55001']).to.not.be(undefined);
        o.__stateUpdate();
        // stabilised() has resolved (got 2 peers, self + 1)
        test.expect(stable).to.equal(true);
        o.stop();
      });
    });

    context('multiple other members discovered (from DB)', function () {
      // sometimes SWIM is first to inform of remote member

      it('pends stabilise until all are connected to ', async function () {
        o.happn.services.data.storage = {
          '/_SYSTEM/DEPLOYMENT/10.0.0.1:56001 ': {
            endpoint: '10.0.0.1:56001',
            service: 'happn-cluster-node',
          },
          '/_SYSTEM/DEPLOYMENT/10.0.0.2:56001 ': {
            endpoint: '10.0.0.2:56001',
            service: 'happn-cluster-node',
          },
          '/_SYSTEM/DEPLOYMENT/10.0.0.3:56001 ': {
            endpoint: '10.0.0.3:56001',
            service: 'happn-cluster-node',
          },
        };

        await o.memberCheck();
        // members already created  (asynchronously) on discovery
        await test.delay(300);
        test.expect(o.members['10.0.0.1:56001']).to.not.be(undefined);
        test.expect(o.members['10.0.0.2:56001']).to.not.be(undefined);
        test.expect(o.members['10.0.0.3:56001']).to.not.be(undefined);
        await test.delay(300);

        test.expect(MockHappnClient.instances['10-0-0-1_56001']).to.not.be(undefined);
        test.expect(MockHappnClient.instances['10-0-0-2_56001']).to.not.be(undefined);
        test.expect(MockHappnClient.instances['10-0-0-3_56001']).to.not.be(undefined);

        var stable = false;

        o.stabilised(function () {
          stable = true;
        });
        await test.delay(300);

        test.expect(stable).to.equal(true);

    //     // remotes log back into us
    //     MockSession.instance.emit('authentic', {
    //       info: {
    //         name: '10-0-0-1_55001',
    //         clusterName: 'happn-cluster',
    //         endpoint: '10.0.0.1:56001',
    //         url: 'http://10.0.0.1:55001',
    //         serviceName: 'happn-cluster-node',
    //       },
    //     });
    //     test.expect(stable).to.equal(false);

    //     MockSession.instance.emit('authentic', {
    //       info: {
    //         name: '10-0-0-2_55001',
    //         clusterName: 'happn-cluster',
    //         endpoint: '10.0.0.2:56001',
    //         url: 'http://10.0.0.2:55001',
    //         serviceName: 'happn-cluster-node',
    //       },
    //     });

    //     test.expect(stable).to.equal(false);

    //     MockSession.instance.emit('authentic', {
    //       info: {
    //         name: '10-0-0-3_55001',
    //         clusterName: 'happn-cluster',
    //         endpoint: '10.0.0.3:56001',
    //         url: 'http://10.0.0.3:55001',
    //         serviceName: 'happn-cluster-node',
    //       },
    //     });
    //     await test.delay(200);
    //     test.expect(stable).to.equal(true);
      });
    });

    context('multiple other members discovered (from happn login to us)', function () {
      // sometimes remote peers logging into us is first to inform of remote member

      it('pends stabilise until all are connected to ', async function () {
        // discover members from their login to us

        MockSession.instance.emit('authentic', {
          info: {
            name: '10-0-0-1_55001',
            clusterName: 'happn-cluster',
            endpoint: '10.0.0.1:56001',
            url: 'http://10.0.0.1:55001',
            serviceName: 'happn-cluster-node',
          },
        });

        MockSession.instance.emit('authentic', {
          info: {
            name: '10-0-0-2_55001',
            clusterName: 'happn-cluster',
            endpoint: '10.0.0.2:56001',
            url: 'http://10.0.0.2:55001',
            serviceName: 'happn-cluster-node',
          },
        });

        MockSession.instance.emit('authentic', {
          info: {
            name: '10-0-0-3_55001',
            clusterName: 'happn-cluster',
            endpoint: '10.0.0.3:56001',
            url: 'http://10.0.0.3:55001',
            serviceName: 'happn-cluster-node',
          },
        });

        test
          .expect(Object.keys(o.members))
          .to.eql([address + ':9000', '10.0.0.1:56001', '10.0.0.2:56001', '10.0.0.3:56001']);

        test.expect(o.members['10.0.0.1:56001']).to.not.be(undefined);
        test.expect(o.members['10.0.0.2:56001']).to.not.be(undefined);
        test.expect(o.members['10.0.0.3:56001']).to.not.be(undefined);

        o.happn.services.data.storage = {
          '/_SYSTEM/DEPLOYMENT/10.0.0.1:55001 ': {
            endpoint: '10.0.0.1:56001',
            service: 'happn-cluster-node',
          },
          '/_SYSTEM/DEPLOYMENT/10.0.0.2:55001 ': {
            endpoint: '10.0.0.2:56001',
            service: 'happn-cluster-node',
          },
          '/_SYSTEM/DEPLOYMENT/10.0.0.3:55001 ': {
            endpoint: '10.0.0.3:56001',
            service: 'happn-cluster-node',
          },
          '/_SYSTEM/DEPLOYMENT/10.0.0.4:55001 ': {
            endpoint: '10.0.0.4:56001',
            service: 'happn-cluster-node',
            name: '10-0-0-4_56001',
          },
        };
        await test.delay(500);

        var stable = false;
        o.stabilised(function () {
          stable = true;
        });

        await test.delay(20);

        MockHappnClient.instances['10-0-0-4_56001'].emitDisconnect();
        await test.delay(20);


        //  correction confirmed: DB reports last member actually gone
        delete o.happn.services.data.storage['/_SYSTEM/DEPLOYMENT/10.0.0.4:55001 '];

        await test.delay(500);
        test.expect(stable).to.equal(true);
        o.stop();
      });
    });

    context('event peer/add', function () {
      it('is emitted when a member becomes fully connected', async function () {
        var emitted = {};
        o.on('peer/add', function (name, member) {
          if (name === 'local-happn-instance') return;
          emitted.name = name;
          emitted.member = member;
        });
        await test.delay(300);

        o.happn.services.data.upsert('/_SYSTEM/DEPLOYMENT/10.0.0.1:55001', {
          endpoint: '10.0.0.1:55001',
          service: 'happn-cluster-node',
          name: '10-0-0-1_55001',
        });

        await test.delay(300);

        // not emitted on new member
        test.expect(emitted).to.eql({});

        // but is emitted once new member fully connected (per login back)
        MockSession.instance.emit('authentic', {
          info: {
            name: '10-0-0-1_55001',
            clusterName: 'happn-cluster',
            endpoint: '10.0.0.1:55001',
            url: 'http://10.0.0.1:55001',
            serviceName: 'happn-cluster-node',
          },
        });
        await test.delay(300);

        test.expect(emitted).to.eql({
          name: '10-0-0-1_55001',
          member: o.peers['10-0-0-1_55001'],
        });
        o.stop();
      });
    });

    context('event peer/remove', function () {
      it('is emitted when a peer socket disconnects from us', async function () {
        o.happn.services.data.upsert('/_SYSTEM/DEPLOYMENT/10.0.0.1:55001', {
          endpoint: '10.0.0.1:55001',
          service: 'happn-cluster-node',
          name: '10-0-0-1_55001',
        });
        await o.memberCheck();

        MockSession.instance.emit('authentic', {
          info: {
            name: '10-0-0-1_55001',
            clusterName: 'happn-cluster',
            endpoint: '10.0.0.1:55001',
            serviceName: 'happn-cluster-node',
          },
        });
        let done;
        // wait for login
        await test.delay(300);

        test.expect(o.peers['10-0-0-1_55001']).to.not.be(undefined);

        o.on('peer/remove', async (name, member) => {
          test.expect(name).to.equal('10-0-0-1_55001');

          // it remains a member (reconnect loop) ...
          test.expect(member).to.equal(o.members['10.0.0.1:55001']);

          // ...until our client disconnects

          MockHappnClient.instances['10-0-0-1_55001'].emitDisconnect();
          test.expect(o.members['10.0.0.1:55001']).to.not.be(undefined);

          // ...and DB confirms
          delete o.happn.services.data.storage['/_SYSTEM/DEPLOYMENT/10.0.0.1:55001'];
          await test.delay(300);
          test.expect(o.members['10.0.0.1:55001']).to.be(undefined);

          done();
        });

        MockSession.instance.emit('disconnect', {
          info: {
            name: '10-0-0-1_55001',
            clusterName: 'happn-cluster',
            endpoint: '10.0.0.1:55001',
            serviceName: 'happn-cluster-node',
          },
        });
        await new Promise((resolve) => {
          done = resolve;
        });
        o.stop();
      });

      it('is emitted when our socket to the peer disconnects', async function () {
        o.happn.services.data.upsert('/_SYSTEM/DEPLOYMENT/10.0.0.1:55007', {
          endpoint: '10.0.0.1:55007',
          service: 'happn-cluster-node',
          name: '10-0-0-1_55007',
        });

        await test.delay(300);
        MockSession.instance.emit('authentic', {
          info: {
            name: '10-0-0-1_55007',
            clusterName: 'happn-cluster',
            endpoint: '10.0.0.1:55007',
            serviceName: 'happn-cluster-node',
          },
        });

        await test.delay(300);

        test.expect(o.peers['10-0-0-1_55007']).to.not.be(undefined);
        let peerRemoved = false;
        // await test.delay(200);

        o.on('peer/remove', function (name, member) {
          test.expect(name).to.equal('10-0-0-1_55007');
          test.expect(member).to.equal(o.members['10.0.0.1:55007']);
          peerRemoved = true;
        });
        MockHappnClient.instances['10-0-0-1_55007'].emitDisconnect();

        await test.delay(300);

        test.expect(peerRemoved).to.be(true);
        o.stop();
      });
    });

    context('errors', function () {
      it('on login error stabilise also fails', async function () {
        MockHappnClient.queueLoginError(new Error('oh no login'));

        o.happn.services.data.upsert('/_SYSTEM/DEPLOYMENT/10.0.0.1:55007', {
          endpoint: '10.0.0.1:55007',
          service: 'happn-cluster-node',
          name: '10-0-0-1_55007',
        });

        try {
          await o.stabilised();
          throw new Error('not this');
        } catch (error) {
          test.expect(error.message).to.equal('oh no login');
        }
      });

      it('on subscription error stabilise also fails', async function () {
        MockHappnClient.queueSubscriptionError(new Error('oh no subscribe'));
        o.happn.services.data.upsert('/_SYSTEM/DEPLOYMENT/10.0.0.1:55007', {
          endpoint: '10.0.0.1:55007',
          service: 'happn-cluster-node',
          name: '10-0-0-1_55007',
        });
        try {
          await o.stabilised();
          throw new Error('not this');
        } catch (error) {
          test.expect(error.message).to.equal('oh no subscribe');
        }
      });

      it('on ECONNREFUSED the member is removed as departed', async function () {
        var e = new Error('connection refused');
        e.code = 'ECONNREFUSED';
        MockHappnClient.queueLoginError(e, () => config.url === 'http://10.0.0.1:55007'); //Only want to error for the one node

        o.happn.services.data.upsert('/_SYSTEM/DEPLOYMENT/10.0.0.1:55007', {
          endpoint: '10.0.0.1:55007',
          service: 'happn-cluster-node',
          name: '10-0-0-1_55007',
        });

        o.happn.services.data.upsert('/_SYSTEM/DEPLOYMENT/10.0.0.1:55008', {
          //Nededs self and 1 other peer to stabilize
          endpoint: '10.0.0.1:55008',
          service: 'happn-cluster-node',
          name: '10-0-0-1_55008',
        });

        MockSession.instance.emit('authentic', {
          info: {
            name: '10-0-0-1_55008',
            clusterName: 'happn-cluster',
            endpoint: '10.0.0.1:55008',
            serviceName: 'happn-cluster-node',
          },
        });

        setTimeout(
          () => delete o.happn.services.data.storage['/_SYSTEM/DEPLOYMENT/10.0.0.1:55007'],
          500
        );
        await o.stabilised();
      });

      it('Removes a member from Peers and Members on Disconnect.', (done) => {
        o.happn.services.data.upsert('/_SYSTEM/DEPLOYMENT/10.0.0.1:55007', {
          endpoint: '10.0.0.1:55007',
          service: 'happn-cluster-node',
          name: '10-0-0-1_55007',
        });
        MockSession.instance.emit('authentic', {
          info: {
            endpoint: '10.0.0.1:55007',
            serviceName: 'happn-cluster-node',
            name: '10-0-0-1_55007',
          },
        });
        MockSession.instance.emit('disconnect', {
          info: {
            name: '10-0-0-1_55001',
            clusterName: 'cluster-name',
            memberId: '10.0.0.1:56001',
            url: 'http://10.0.0.1:55001',
          },
        });
        test.expect(o.peers['10-0-0-1_55001']).to.be.undefined;
        test.expect(o.members['10-0-0-1_55001']).to.be.undefined;
        done();
      });
    });
  });

  context('health', function () {
    let o;
    beforeEach(function (done) {
      o = new Orchestrator(mockOpts);
      o.happn = new MockHappn('http', 9000);
      o.HappnClient = MockHappnClient;
      o.initialize({ timing: { keepAlive: 200, memberRefresh: 200 } }, done);
    });

    it('tests health logging, single service, alsso will not log JSON again if stats havent changed ', () => {
      o.log.info = test.sinon.spy();
      o.log.json.info = test.sinon.spy();
      o.log.json.warn = test.sinon.spy();
      o.registry['happn-cluster-node'] = {
        name: 'happn-cluster-node',
        expected: 2,
        members: { '1.2.3.4': {}, '5.6.7.8': {}, '9.10.11.12': {} },
        peers: { '5.6.7.8': { endpoint: '5.6.7.8' }, '9.10.11.12': { endpoint: '9.10.11.12' } },
        numPeers: 2,
      };
      o.state = 'STABLE';
      o.endpoint = '5.6.7.8';
      o.healthReport();
      test.expect(o.log.info.callCount).to.be(2);
      test
        .expect(
          o.log.info.calledWith(
            'Member: name local-happn-instance, endpoint: 5.6.7.8, service: happn-cluster-node, state: STABLE'
          )
        )
        .to.be(true);
      test
        .expect(
          o.log.info.calledWith(
            'Node: local-happn-instance breakdown: \n' +
              '\tService happn-cluster-node has 2 peers of 2 required'
          )
        )
        .to.be(true);

      test.expect(o.log.json.info.callCount).to.be(1);
      test
        .expect(
          o.log.json.info.calledWith(
            {
              MEMBER_ID: 'local-happn-instance',
              MEMBER_ENDPOINT: '5.6.7.8',
              TOTAL_CLUSTER_MEMBERS: 3,
              TOTAL_CLUSTER_PEERS: 2,
              UNHEALTHY_MEMBERS: ['1.2.3.4'],
              STATUS: 'STABLE', // technically, shouldn't be STABLE and have unhealthy members, just for test.
            },
            'happn-cluster-health'
          )
        )
        .to.be(true);
      o.healthReport();
      test.expect(o.log.json.info.callCount).to.be(1); //Stats haven't changed, shouldn't be called again
    });

    it('tests health logging, multiple services, also will not log JSON again if stats havent changed ', () => {
      o.log.info = test.sinon.spy();
      o.log.json.info = test.sinon.spy();
      o.log.json.warn = test.sinon.spy();
      o.registry['service-1'] = {
        name: 'service-1',
        expected: 2,
        members: { '1.2.3.4': {}, '5.6.7.8': {}, '9.10.11.12': {} },
        peers: { '5.6.7.8': { endpoint: '5.6.7.8' }, '9.10.11.12': { endpoint: '9.10.11.12' } },
        numPeers: 2,
      };
      o.registry['service-2'] = {
        name: 'service-2',
        expected: 2,
        members: { '4.3.2.1': {}, '8.7.6.5': {}, '12.11.10.9': {} },
        peers: { '4.3.2.1': { endpoint: '4.3.2.1' }, '8.7.6.5': { endpoint: '8.7.6.5' } },
        numPeers: 3,
      };
      o.state = 'STABLE';
      o.endpoint = '5.6.7.8';
      o.healthReport();
      test.expect(o.log.info.callCount).to.be(2);
      test
        .expect(
          o.log.info.calledWith(
            'Member: name local-happn-instance, endpoint: 5.6.7.8, service: happn-cluster-node, state: STABLE'
          )
        )
        .to.be(true);
      test
        .expect(
          o.log.info.calledWith(
            'Node: local-happn-instance breakdown: \n' +
              '\tService happn-cluster-node has 0 peers of 1 required\n' + //This is created because of blank config
              '\tService service-1 has 2 peers of 2 required\n' +
              '\tService service-2 has 3 peers of 2 required'
          )
        )
        .to.be(true);

      test.expect(o.log.json.info.callCount).to.be(1);
      test
        .expect(
          o.log.json.info.calledWith(
            {
              MEMBER_ID: 'local-happn-instance',
              MEMBER_ENDPOINT: '5.6.7.8',
              TOTAL_CLUSTER_MEMBERS: 6,
              TOTAL_CLUSTER_PEERS: 4,
              UNHEALTHY_MEMBERS: ['1.2.3.4', '12.11.10.9'],
              STATUS: 'STABLE',
            },
            'happn-cluster-health'
          )
        )
        .to.be(true);
      o.healthReport();
      test.expect(o.log.json.info.callCount).to.be(1); //Stats haven't changed, shouldn't be called again
    });

    it('will log.JSON.warn if state is not stable', () => {
      o.log.info = test.sinon.spy();
      o.log.json.info = test.sinon.spy();
      o.log.json.warn = test.sinon.spy();
      o.registry['happn-cluster-node'] = {
        name: 'happn-cluster-node',
        expected: 2,
        members: { '1.2.3.4': {}, '5.6.7.8': {}, '9.10.11.12': {} },
        peers: { '5.6.7.8': { endpoint: '5.6.7.8' }, '9.10.11.12': { endpoint: '9.10.11.12' } },
        numPeers: 2,
      };
      o.state = 'BAD';
      o.endpoint = '5.6.7.8';
      o.healthReport();
      test.expect(o.log.info.callCount).to.be(2);
      test.expect(o.log.json.info.callCount).to.be(0);
      test.expect(o.log.json.warn.callCount).to.be(1);
      test
        .expect(
          o.log.json.warn.calledWith(
            {
              MEMBER_ID: 'local-happn-instance',
              MEMBER_ENDPOINT: '5.6.7.8',
              TOTAL_CLUSTER_MEMBERS: 3,
              TOTAL_CLUSTER_PEERS: 2,
              UNHEALTHY_MEMBERS: ['1.2.3.4'],
              STATUS: 'BAD',
            },
            'happn-cluster-health'
          )
        )
        .to.be(true);
      o.healthReport();
      test.expect(o.log.json.warn.callCount).to.be(1); //Stats haven't changed, shouldn't be called again
    });

    it('will log.JSON if stats change', () => {
      o.log.info = test.sinon.spy();
      o.log.json.info = test.sinon.spy();
      o.log.json.warn = test.sinon.spy();
      o.registry['happn-cluster-node'] = {
        name: 'happn-cluster-node',
        expected: 2,
        members: { '1.2.3.4': {}, '5.6.7.8': {}, '9.10.11.12': {} },
        peers: { '5.6.7.8': { endpoint: '5.6.7.8' }, '9.10.11.12': { endpoint: '9.10.11.12' } },
        numPeers: 2,
      };
      o.state = 'STABLE';
      o.endpoint = '5.6.7.8';
      o.healthReport();
      test.expect(o.log.info.callCount).to.be(2);
      test.expect(o.log.json.info.callCount).to.be(1);
      o.registry['happn-cluster-node'].peers = { '5.6.7.8': {} }; // 1 more unhealthy member
      o.healthReport();
      test.expect(o.log.json.info.callCount).to.be(2); //Stats havew changed, should be called again
    });
  });
  after(function () {
    process.env.LOG_LEVEL = this.logLevel;
  });
});
