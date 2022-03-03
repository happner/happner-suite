var Orchestrator = require('../../../lib/services/orchestrator');
var MockHappn = require('../../mocks/mock-happn');
var MockHappnClient = require('../../mocks/mock-happn-client');
var MockSession = require('../../mocks/mock-session');
var mockOpts = require('../../mocks/mock-opts');
var address = require('../../../lib/utils/get-address')()();

// require('../../lib/test-helper').describe({ timeout: 30e3, skip: true }, function (test) {
//   before(function () {
//     this.logLevel = process.env.LOG_LEVEL;
//     process.env.LOG_LEVEL = 'off';
//   });

//   context('initialise', function () {
//     it('subscribes to happn server connection events', function (done) {
//       var o = new Orchestrator(mockOpts);
//       o.happn = new MockHappn('http', 9000);
//       o.__onConnectionFrom = sinon.spy();
//       o.__onDisconnectionFrom = sinon.spy();

//       o.initialize({}, function (e) {
//         if (e) return done(e);

//         MockSession.instance._events.authentic();
//         test.expect(o.__onConnectionFrom.calledOnce).to.be(true);
//         test.expect(o.__onConnectionFrom.alwaysCalledOn(o)).to.be(true);

//         MockSession.instance._events.disconnect();
//         test.expect(o.__onDisconnectionFrom.calledOnce).to.be(true);
//         test.expect(o.__onDisconnectionFrom.alwaysCalledOn(o)).to.be(true);
//         done();
//       });
//     });

//     it('defaults config', function (done) {
//       var o = new Orchestrator(mockOpts);
//       o.happn = new MockHappn('http', 9000);

//       o.initialize({}, function (e) {
//         if (e) return done(e);

//         test.expect(o.config).to.eql({
//           keepaliveThreshold: 2000,
//           replicate: ['*'],
//           serviceName: 'happn-cluster-node',
//           deployment: 'Test-Deploy',
//           clusterName: 'happn-cluster',
//           stabiliseTimeout: 15000,
//           cluster: { 'happn-cluster-node': 1 },
//         });

//         done();
//       });
//     });

//     it('can assign all config', function (done) {
//       var o = new Orchestrator(mockOpts);
//       o.happn = new MockHappn('http', 9000);

//       o.initialize(
//         {
//           minimumPeers: 3,
//           replicate: [],
//           stableReportInterval: 10000,
//         },
//         function (e) {
//           if (e) return done(e);

//           test.expect(o.config).to.eql({
//             minimumPeers: 3,
//             replicate: ['/__REPLICATE'],
//             stableReportInterval: 10000,
//             keepaliveThreshold: 2000,
//             serviceName: 'happn-cluster-node',
//             deployment: 'Test-Deploy',
//             clusterName: 'happn-cluster',
//             stabiliseTimeout: 15000,
//             cluster: { 'happn-cluster-node': 3 },
//           });

//           done();
//         }
//       );
//     });

//     context('reduce replication paths', function () {
//       var o;

//       beforeEach(function () {
//         o = new Orchestrator(mockOpts);
//         o.happn = new MockHappn('http', 9000);
//       });

//       it('removes duplicate paths', function (done) {
//         o.initialize(
//           {
//             replicate: ['/same/path', '/same/path'],
//           },
//           function (e) {
//             if (e) return done(e);

//             test.expect(o.config.replicate).to.eql(['/same/path', '/__REPLICATE']);
//             done();
//           }
//         );
//       });

//       it('collapses simple wildcard paths (forward)', function (done) {
//         o.initialize(
//           {
//             replicate: ['/same/*', '/same/path'],
//           },
//           function (e) {
//             if (e) return done(e);

//             test.expect(o.config.replicate).to.eql(['/same/*', '/__REPLICATE']);
//             done();
//           }
//         );
//       });

//       it('collapses simple wildcard paths (backwards)', function (done) {
//         o.initialize(
//           {
//             replicate: ['/same/path', '/same/*'],
//           },
//           function (e) {
//             if (e) return done(e);

//             test.expect(o.config.replicate).to.eql(['/same/*', '/__REPLICATE']);
//             done();
//           }
//         );
//       });

//       it('collapses complicated wildcard paths (forward)', function (done) {
//         o.initialize(
//           {
//             replicate: ['/same/*/with/*/more', '/same/path', '/same/path/with/some/more'],
//           },
//           function (e) {
//             if (e) return done(e);

//             test
//               .expect(o.config.replicate)
//               .to.eql(['/same/*/with/*/more', '/same/path', '/__REPLICATE']);
//             done();
//           }
//         );
//       });

//       it('collapses complicated wildcard paths (reverse)', function (done) {
//         o.initialize(
//           {
//             replicate: ['/same/path/with/some/more', '/same/*/with/*/more', '/same/path/*'],
//           },
//           function (e) {
//             if (e) return done(e);

//             test
//               .expect(o.config.replicate.sort())
//               .to.eql(['/__REPLICATE', '/same/*/with/*/more', '/same/path/*']);
//             done();
//           }
//         );
//       });

//       it('does the obvious', function (done) {
//         o.initialize(
//           {
//             replicate: ['/same/*/with/some/more', '/same/path/with/*/more', '/same/path', '/*'],
//           },
//           function (e) {
//             if (e) return done(e);

//             test
//               .expect(o.config.replicate.sort())
//               .to.eql(
//                 ['/same/path', '/same/*/with/some/more', '/same/path/with/*/more', '/*'].sort()
//               );
//             done();
//           }
//         );
//       });

//       it('is idiot proof', function (done) {
//         o.initialize(
//           {
//             replicate: [
//               '/*/*/*/*/*/*/*/*/*',
//               '/*/*/*/*/*/*/*/*',
//               '/*/*/*/*/*/*/*',
//               '/*/*/*/*/*/*',
//               '/*/*/*/*/*',
//               '/*/*/*/*',
//               '/*/*/*',
//               '/*/*',
//               '/*',
//             ],
//           },
//           function (e) {
//             if (e) return done(e);

//             test
//               .expect(o.config.replicate)
//               .to.eql([
//                 '/*/*/*/*/*/*/*/*/*',
//                 '/*/*/*/*/*/*/*/*',
//                 '/*/*/*/*/*/*/*',
//                 '/*/*/*/*/*/*',
//                 '/*/*/*/*/*',
//                 '/*/*/*/*',
//                 '/*/*/*',
//                 '/*/*',
//                 '/*',
//               ]);
//             done();
//           }
//         );
//       });
//     });
//   });

//   context('stop', function () {
//     it('stops all members', function (done) {
//       var o = new Orchestrator(mockOpts);
//       o.happn = new MockHappn('http', 9000);

//       var stopped = 0;

//       var stop = function () {
//         console.log();
//         return new Promise(function (resolve) {
//           stopped++;
//           resolve();
//         });
//       };

//       o.initialize({}, function (e) {
//         if (e) return done(e);
//         o.registry['happn-cluster-node'].members = {
//           memberId1: {
//             stop: stop,
//           },
//           memberId2: {
//             stop: stop,
//           },
//           memberId3: {
//             stop: stop,
//           },
//         };
//         o.stop(function (e) {
//           if (e) return done(e);
//           test.expect(stopped).to.equal(3);
//           done();
//         });
//       });
//     });
//   });

//   context('start', function () {
//     var o;

//     beforeEach(function (done) {
//       o = new Orchestrator(mockOpts);
//       o.happn = new MockHappn('http', 9000);
//       o.HappnClient = MockHappnClient;
//       o.startIntervals = () => {}; //Don't want to start intervals for these tests, requires too much mocking
//       o.initialize({}, done);
//     });

//     it('starts loginConfig for inter-cluster happn client logins', async function () {
//       await o.start();
//       test.expect(o.loginConfig).to.eql({
//         info: {
//           name: 'local-happn-instance',
//           clusterName: 'happn-cluster',
//           serviceName: 'happn-cluster-node',
//           endpoint: address + ':9000',
//         },
//       });
//     });

//     it('uses alternative host in url if announceHost is defined', function (done) {
//       o.announceHost = 'alternate-host-or-ip';
//       o.start()
//         .then(function () {
//           test.expect(o.loginConfig).to.eql({
//             info: {
//               name: 'local-happn-instance',
//               clusterName: 'happn-cluster',
//               serviceName: 'happn-cluster-node',
//               endpoint: 'alternate-host-or-ip:9000',
//             },
//           });

//           done();
//         })
//         .catch(done);
//     });

//     it('connects intra-process client to self', function (done) {
//       o.start()

//         .then(function () {
//           test.expect(MockHappnClient.getLastLoginConfig()).to.eql({
//             context: {},
//             info: {
//               name: 'local-happn-instance',
//               serviceName: 'happn-cluster-node',
//               endpoint: '192.168.9.4:9000',
//             },
//           });

//           done();
//         })
//         .catch(done);
//     });
//   });

//   context.only('stabilised', function () {
//     var o;

//     beforeEach(function () {
//       MockHappnClient.instances = {};
//     });

//     beforeEach(function (done) {
//       o = new Orchestrator(mockOpts);
//       o.happn = new MockHappn('http', 9000);
//       o.HappnClient = MockHappnClient;
//       // o.startIntervals = () => {}; //Don't want to start intervals for these tests, requires too much mocking
//       o.initialize({ intervals: { keepAlive: 200, membership: 200 } }, function (e) {
//         if (e) return done(e);
//         o.start().then(done).catch(done);
//       });
//     });

//     context('first member in cluster', function () {
//       it('immediately stabilises with only self as member', function (done) {
//         o.stabilised()
//           .then(function () {
//             test.expect(Object.keys(o.peers)).to.eql([address + ':9000']);
//             test.expect(o.peers.__self).to.equal(o.peers[address + ':9000']);

//             done();
//           })
//           .catch(done);
//       });

//       it('pends stabilise if minimumPeers is set', function (done) {
//         var stable = false;

//         o.registry['happn-cluster-node'].expected = 2;

//         o.stabilised(function () {
//           stable = true;
//         });

//         setTimeout(function () {
//           // stabilised() has not resolved
//           test.expect(stable).to.equal(false);

//           // new member discovered
//           o.happn.services.data.upsert('/_SYSTEM/DEPLOYMENT/10.0.0.1:55001 ', {
//             endpoint: '10.0.0.1:56001',
//             service: 'happn-cluster-node',
//             name: '10-0-0-1_55001',
//           });
//           test.delay(700).then(() => {
//             // member record was added
//             // console.log(o.members);
//             test.expect(o.members['10.0.0.1:56001']).to.not.be(undefined); // SWIM host as key

//             // peer record was not added
//             test.expect(o.peers['10.0.0.1:56001']).to.be(undefined);
//             // wait for member login to remote
//             setTimeout(function () {
//               // member logged in to remote
//               // test.expect(MockHappnClient.instances['10-0-0-1_55001']).to.not.be(undefined); // remote happn.name as key

//               // member state is correct
//               test.expect(o.members['10.0.0.1:56001'].connectingTo).to.equal(false);
//               test.expect(o.members['10.0.0.1:56001'].connectedTo).to.equal(true);
//               test.expect(o.members['10.0.0.1:56001'].connectedFrom).to.equal(false); // <---- pending login back to us
//               test.expect(o.members['10.0.0.1:56001'].subscribedTo).to.equal(true);
//               // test.expect(o.members['10.0.0.1:56001'].subscribedFrom).to.equal(true);

//               // THEN... peer logs back into us
//               MockSession.instance.emit('authentic', {
//                 info: {
//                   name: '10-0-0-1_55001',
//                   clusterName: 'cluster-name',
//                   endpoint: '10.0.0.1:56001',
//                   url: 'http://10.0.0.1:55001',
//                   serviceName: 'happn-cluster-node',
//                 },
//               });

//               test.expect(o.members['10.0.0.1:56001'].connectedFrom).to.equal(true); // <---- pending login done

//               // added as peer
//               test.expect(o.peers['10.0.0.1:56001']).to.not.be(undefined);
//               o.__stateUpdate();
//               // stabilised() has resolved (got 2 peers, self + 1)
//               test.expect(stable).to.equal(true);
//               o.stop();
//               done();
//             });
//           }, 1000);
//         }, 20);
//       });
//     });

//     context('multiple other members discovered (from DB)', function () {
//       // sometimes SWIM is first to inform of remote member

//       it('pends stabilise until all are connected to and from', function (done) {
//         var stable = false;

//         o.registry['happn-cluster-node'].expected = 2;

//         o.happn.services.data.storage = {
//           '/_SYSTEM/DEPLOYMENT/10.0.0.1:55001 ': {
//             endpoint: '10.0.0.1:56001',
//             service: 'happn-cluster-node',
//           },
//           '/_SYSTEM/DEPLOYMENT/10.0.0.2:55001 ': {
//             endpoint: '10.0.0.2:56001',
//             service: 'happn-cluster-node',
//           },
//           '/_SYSTEM/DEPLOYMENT/10.0.0.3:55001 ': {
//             endpoint: '10.0.0.3:56001',
//             service: 'happn-cluster-node',
//           },
//         };

//         o.memberCheck();
//         // members already (immediately) created on discovery
//         setTimeout(() => {
//           // console.log(o.members)
//           test.expect(o.members['10.0.0.1:56001']).to.not.be(undefined);
//           test.expect(o.members['10.0.0.2:56001']).to.not.be(undefined);
//           test.expect(o.members['10.0.0.3:56001']).to.not.be(undefined);

//           // wait for member logins to remote peers
//           setTimeout(function () {
//             // test.expect(MockHappnClient.instances['10-0-0-1_55001']).to.not.be(undefined);
//             // test.expect(MockHappnClient.instances['10-0-0-2_55001']).to.not.be(undefined);
//             // test.expect(MockHappnClient.instances['10-0-0-3_55001']).to.not.be(undefined);

//             // var stable = false;

//             o.stabilised(function () {
//               stable = true;
//             });

//             setTimeout(function () {
//               // console.log('PEERS', Object.keys(o.peers));
//               test.expect(stable).to.equal(false);

//               // remotes log back into us
//               MockSession.instance.emit('authentic', {
//                 info: {
//                   name: '10-0-0-1_55001',
//                   clusterName: 'happn-cluster',
//                   endpoint: '10.0.0.1:56001',
//                   url: 'http://10.0.0.1:55001',
//                   serviceName: 'happn-cluster-node',
//                 },
//               });
//               test.expect(stable).to.equal(false);

//               MockSession.instance.emit('authentic', {
//                 info: {
//                   name: '10-0-0-2_55001',
//                   clusterName: 'happn-cluster',
//                   endpoint: '10.0.0.2:56001',
//                   url: 'http://10.0.0.2:55001',
//                   serviceName: 'happn-cluster-node',
//                 },
//               });

//               test.expect(stable).to.equal(false);

//               MockSession.instance.emit('authentic', {
//                 info: {
//                   name: '10-0-0-3_55001',
//                   clusterName: 'happn-cluster',
//                   endpoint: '10.0.0.3:56001',
//                   url: 'http://10.0.0.3:55001',
//                   serviceName: 'happn-cluster-node',
//                 },
//               });

//               test.expect(stable).to.equal(true);
//               o.stop();
//               done();
//             }, 300);
//           }, 300);
//         }, 300);
//       });
//     });

//     context('multiple other members discovered (from happn login to us)', function () {
//       // sometimes remote peers logging into us is first to inform of remote member

//       it.only('pends stabilise until all are connected to and from', function (done) {
//         test.expect(Object.keys(o.members)).to.eql([]);

//         // discover members from their login to us

//         MockSession.instance.emit('authentic', {
//           info: {
//             name: '10-0-0-1_55001',
//             clusterName: 'happn-cluster',
//             endpoint: '10.0.0.1:56001',
//             url: 'http://10.0.0.1:55001',
//             serviceName: 'happn-cluster-node',
//           },
//         });

//         MockSession.instance.emit('authentic', {
//           info: {
//             name: '10-0-0-2_55001',
//             clusterName: 'happn-cluster',
//             endpoint: '10.0.0.2:56001',
//             url: 'http://10.0.0.2:55001',
//             serviceName: 'happn-cluster-node',
//           },
//         });

//         MockSession.instance.emit('authentic', {
//           info: {
//             name: '10-0-0-3_55001',
//             clusterName:'happn-cluster',
//             endpoint: '10.0.0.3:56001',
//             url: 'http://10.0.0.3:55001',
//             serviceName: 'happn-cluster-node',
//           },
//         });

//         test
//           .expect(Object.keys(o.members))
//           .to.eql(['10.0.0.1:56001', '10.0.0.2:56001', '10.0.0.3:56001']);

//         test.expect(o.members['10.0.0.1:56001']).to.not.be(undefined);
//         test.expect(o.members['10.0.0.2:56001']).to.not.be(undefined);
//         test.expect(o.members['10.0.0.3:56001']).to.not.be(undefined);

//         // wait for members to login to remote peers
//         setTimeout(function () {
//           // test.expect(MockHappnClient.instances['10-0-0-1_55001']).to.not.be(undefined);
//           // test.expect(MockHappnClient.instances['10-0-0-2_55001']).to.not.be(undefined);
//           // test.expect(MockHappnClient.instances['10-0-0-3_55001']).to.not.be(undefined);

//           // then discover same + 1 members from swim
//           // MockMembership.instance.emit('add', {
//           //   memberId: '10.0.0.1:56001',
//           //   url: 'http://10.0.0.1:55001',
//           // });

//           // MockMembership.instance.emit('add', {
//           //   memberId: '10.0.0.2:56001',
//           //   url: 'http://10.0.0.2:55001',
//           // });

//           // MockMembership.instance.emit('add', {
//           //   memberId: '10.0.0.3:56001',
//           //   url: 'http://10.0.0.3:55001',
//           // });

//           // MockMembership.instance.emit('add', {
//           //   memberId: '10.0.0.4:56001',
//           //   url: 'http://10.0.0.4:55001',
//           // });
//           o.happn.services.data.storage = {
//             '/_SYSTEM/DEPLOYMENT/10.0.0.1:55001 ': {
//               endpoint: '10.0.0.1:56001',
//               service: 'happn-cluster-node',
//             },
//             '/_SYSTEM/DEPLOYMENT/10.0.0.2:55001 ': {
//               endpoint: '10.0.0.2:56001',
//               service: 'happn-cluster-node',
//             },
//             '/_SYSTEM/DEPLOYMENT/10.0.0.3:55001 ': {
//               endpoint: '10.0.0.3:56001',
//               service: 'happn-cluster-node',
//             },
//             '/_SYSTEM/DEPLOYMENT/10.0.0.4:55001 ': {
//               endpoint: '10.0.0.4:56001',
//               service: 'happn-cluster-node',
//               name: "10-0-0-4_56001"
//             },
//           };

//           var stable = false;
//           o.stabilised()
//             .then(function () {
//               stable = true;
//             })
//             .catch(done);

//           setTimeout(function () {
//             console.log("MEMBERs  ", Object.keys(o.members))
//             console.log("PEERS", Object.keys(o.peers))

//             // test.expect(stable).to.equal(false);

//             // correction: socket reports last member actually gone
//             console.log(Object.keys(MockHappnClient.instances));
//             MockHappnClient.instances['10-0-0-4_55001'].emitDisconnect();
//             test.expect(stable).to.equal(false);

//             // correction confirmed: swim reports last member actually gone
//             // MockMembership.instance.emit('remove', {
//             //   memberId: '10.0.0.4:56001',
//             // });

//             setTimeout(function () {
//               // no longer waiting for 4 peer
//               test.expect(stable).to.equal(true);
//               done();
//             }, 20);
//           }, 20);
//         }, 320);
//       });
//     });

//     context('event peer/add', function () {
//       it('is emitted when a member becomes fully connected', function (done) {
//         var emitted = {};
//         o.on('peer/add', function (name, member) {
//           if (name === 'local-happn-instance') return;
//           emitted.name = name;
//           emitted.member = member;
//         });

//         MockMembership.instance.emit('add', {
//           memberId: '10.0.0.1:56001',
//           url: 'http://10.0.0.1:55001',
//         });

//         setTimeout(function () {
//           // not emitted on new member
//           test.expect(emitted).to.eql({});
//           test.expect(Object.keys(o.peers)).to.eql(['local-happn-instance']);

//           // but is emitted once new member fully connected (per login back)
//           MockSession.instance.emit('authentic', {
//             info: {
//               name: '10-0-0-1_55001',
//               clusterName: 'cluster-name',
//               memberId: '10.0.0.1:56001',
//               url: 'http://10.0.0.1:55001',
//             },
//           });

//           test.expect(emitted).to.eql({
//             name: '10-0-0-1_55001',
//             member: o.peers['10-0-0-1_55001'],
//           });
//           done();
//         }, 20);
//       });
//     });

//     context('event peer/remove', function () {
//       it('is emitted when a peer socket disconnects from us', function (done) {
//         MockMembership.instance.emit('add', {
//           memberId: '10.0.0.1:56001',
//           url: 'http://10.0.0.1:55001',
//         });

//         MockSession.instance.emit('authentic', {
//           info: {
//             name: '10-0-0-1_55001',
//             clusterName: 'cluster-name',
//             memberId: '10.0.0.1:56001',
//             url: 'http://10.0.0.1:55001',
//           },
//         });

//         // wait for login
//         setTimeout(function () {
//           test.expect(o.peers['10-0-0-1_55001']).to.not.be(undefined);

//           o.on('peer/remove', function (name, member) {
//             test.expect(name).to.equal('10-0-0-1_55001');

//             // it remains a member (reconnect loop) ...
//             test.expect(member).to.equal(o.members['10.0.0.1:56001']);

//             // ...until our client disconnects
//             MockHappnClient.instances['10-0-0-1_55001'].emitDisconnect();
//             test.expect(o.members['10.0.0.1:56001']).to.not.be(undefined);

//             // ...and swim confirms
//             MockMembership.instance.emit('remove', {
//               memberId: '10.0.0.1:56001',
//             });

//             setTimeout(function () {
//               test.expect(o.members['10.0.0.1:56001']).to.be(undefined);
//               done();
//             }, 20);
//           });

//           MockSession.instance.emit('disconnect', {
//             info: {
//               name: '10-0-0-1_55001',
//               clusterName: 'cluster-name',
//               memberId: '10.0.0.1:56001',
//               url: 'http://10.0.0.1:55001',
//             },
//           });
//         }, 20);
//       });

//       it('is emitted when our socket to the peer disconnects', function (done) {
//         MockMembership.instance.emit('add', {
//           memberId: '10.0.0.1:56001',
//           url: 'http://10.0.0.1:55001',
//         });

//         MockSession.instance.emit('authentic', {
//           info: {
//             name: '10-0-0-1_55001',
//             clusterName: 'cluster-name',
//             memberId: '10.0.0.1:56001',
//             url: 'http://10.0.0.1:55001',
//           },
//         });

//         setTimeout(function () {
//           test.expect(o.peers['10-0-0-1_55001']).to.not.be(undefined);

//           o.on('peer/remove', function (name, member) {
//             test.expect(name).to.equal('10-0-0-1_55001');
//             test.expect(member).to.equal(o.members['10.0.0.1:56001']);
//             done();
//           });

//           MockHappnClient.instances['10-0-0-1_55001'].emitDisconnect();
//         }, 20);
//       });

//       it('is NOT emitted when swim reports departure but sockets are connected', function (done) {
//         // swim flaps when large numbers of new members get added at once
//         // so it gets ignored if peer (happn client) sockets are still connected
//         // (ws pingpong will pick up the slack)

//         MockMembership.instance.emit('add', {
//           memberId: '10.0.0.1:56001',
//           url: 'http://10.0.0.1:55001',
//         });

//         MockSession.instance.emit('authentic', {
//           info: {
//             name: '10-0-0-1_55001',
//             clusterName: 'cluster-name',
//             memberId: '10.0.0.1:56001',
//             url: 'http://10.0.0.1:55001',
//           },
//         });

//         setTimeout(function () {
//           test.expect(o.peers['10-0-0-1_55001']).to.not.be(undefined);

//           var removed = false;
//           o.on('peer/remove', function () {
//             removed = true;
//           });

//           MockMembership.instance.emit('remove', {
//             memberId: '10.0.0.1:56001',
//           });

//           setTimeout(function () {
//             test.expect(removed).to.equal(false);
//             done();
//           }, 20);
//         }, 20);
//       });
//     });

//     context('errors', function () {
//       it('on login error stabilise also fails', function (done) {
//         MockHappnClient.queueLoginError(new Error('oh no login'));

//         MockMembership.instance.emit('add', {
//           memberId: '10.0.0.1:56001',
//           url: 'http://10.0.0.1:55001',
//         });

//         o.stabilised()
//           .then(function () {
//             throw new Error('not this');
//           })
//           .catch(function (error) {
//             test.expect(error.message).to.equal('oh no login');
//             o.stop(done);
//           })
//           .catch(done);
//       });

//       it('on subscription error stabilise also fails', function (done) {
//         MockHappnClient.queueSubscriptionError(new Error('oh no subscribe'));

//         MockMembership.instance.emit('add', {
//           memberId: '10.0.0.1:56001',
//           url: 'http://10.0.0.1:55001',
//         });

//         o.stabilised()
//           .then(function () {
//             throw new Error('not this');
//           })
//           .catch(function (error) {
//             test.expect(error.message).to.equal('oh no subscribe');
//             done();
//           });
//       });

//       it('on ECONNREFUSED the member is removed as departed', function (done) {
//         var e = new Error('connection refused');
//         e.code = 'ECONNREFUSED';
//         MockHappnClient.queueLoginError(e);

//         MockMembership.instance.emit('add', {
//           memberId: '10.0.0.1:56001',
//           url: 'http://10.0.0.1:55001',
//         });

//         o.stabilised()
//           .then(function () {
//             // stabilises, unaffected by ECONNREFUSED (member is gone)
//             done();
//           })
//           .catch(done);
//       });

//       it('Removes a member from Peers and Members on Disconnect.', (done) => {
//         MockMembership.instance.emit('add', {
//           memberId: '10.0.0.1:56001',
//           url: 'http://10.0.0.1:55001',
//         });

//         MockSession.instance.emit('authentic', {
//           info: {
//             name: '10-0-0-1_55001',
//             clusterName: 'cluster-name',
//             memberId: '10.0.0.1:56001',
//             url: 'http://10.0.0.1:55001',
//           },
//         });
//         MockSession.instance.emit('disconnect', {
//           info: {
//             name: '10-0-0-1_55001',
//             clusterName: 'cluster-name',
//             memberId: '10.0.0.1:56001',
//             url: 'http://10.0.0.1:55001',
//           },
//         });
//         test.expect(o.peers['10-0-0-1_55001']).to.be.undefined;
//         test.expect(o.members['10-0-0-1_55001']).to.be.undefined;
//         done();
//       });
//     });
//   });
//   after(function () {
//     process.env.LOG_LEVEL = this.logLevel;
//   });
// });
