const ServiceEntry = require('../../../../lib/services/orchestrator/serviceEntry');
const Member = require('../../../../lib/services/orchestrator/member');
const orchestrator = require('../../../mocks/test-unit/mock-orchestrator');
require('../../../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
  context('create', () => {
    it('Creates a service entry, contructor', (done) => {
      let serviceEntry = new ServiceEntry('New Service', 1, orchestrator);
      test.expect(serviceEntry).to.be.ok();
      test.expect(serviceEntry.name).to.be('New Service');
      test.expect(serviceEntry.orchestrator).to.be(orchestrator);
      test.expect(serviceEntry.expected).to.be(1);
      done();
    });

    it('Creates a service entry, create method', (done) => {
      let serviceEntry = ServiceEntry.create('New Service2', 3, orchestrator);
      test.expect(serviceEntry).to.be.ok();
      test.expect(serviceEntry.name).to.be('New Service2');
      test.expect(serviceEntry.orchestrator).to.be(orchestrator);
      test.expect(serviceEntry.expected).to.be(3);
      done();
    });
  });

  context('get', () => {
    it('gets found', (done) => {
      let serviceEntry = ServiceEntry.create('New Service2', 3, orchestrator);
      test.expect(serviceEntry.found).to.be(0);
      serviceEntry.endpoints = ['1', '2', '3'];
      test.expect(serviceEntry.found).to.be(3);
      done();
    });

    it('gets foundEnoughPeers', (done) => {
      let serviceEntry = ServiceEntry.create('New Service2', 3, orchestrator);
      test.expect(serviceEntry.foundEnoughPeers).to.be(false);
      serviceEntry.endpoints = ['1', '2', '3'];
      test.expect(serviceEntry.foundEnoughPeers).to.be(true);
      serviceEntry.endpoints = ['1', '2', '3', '4', '5'];
      test.expect(serviceEntry.foundEnoughPeers).to.be(true);
      done();
    });

    it('gets foundOthers', (done) => {
      let serviceEntry = ServiceEntry.create('New Service2', 3, orchestrator);
      serviceEntry.myEndpoint = 'enpoint-mine';
      test.expect(serviceEntry.foundOthers).to.be(false);
      serviceEntry.endpoints = ['enpoint-mine'];
      test.expect(serviceEntry.foundOthers).to.be(false);
      serviceEntry.endpoints = ['enpoint-mine', '1', '2'];
      test.expect(serviceEntry.foundOthers).to.be(true);
      serviceEntry.endpoints = ['1', '2'];
      test.expect(serviceEntry.foundOthers).to.be(true);
      done();
    });

    it('gets connected', (done) => {
      let serviceEntry = ServiceEntry.create('New Service2', 3, orchestrator);
      test.expect(serviceEntry.connected).to.be(0);
      serviceEntry.members = {
        one: { connected: true },
        two: { connected: true },
        three: { connected: false },
      };
      test.expect(serviceEntry.connected).to.be(2);
      done();
    });

    it('gets isConnected', (done) => {
      let serviceEntry = ServiceEntry.create('New Service2', 3, orchestrator);
      test.expect(serviceEntry.isConnected).to.be(false);
      serviceEntry.members = {
        one: { connected: true },
        two: { connected: true },
        three: { connected: false },
      };
      test.expect(serviceEntry.isConnected).to.be(false);
      serviceEntry.members.four = { connected: true };
      test.expect(serviceEntry.isConnected).to.be(true);
      done();
    });

    it('gets peers, numPeers and peersFulfilled ', (done) => {
      let peer1 = { peer: true, endpoint: 'peer1', name: 'peer1' };
      let peer2 = { peer: true, endpoint: 'peer2', name: 'peer2' };
      let peer3 = { peer: true, endpoint: 'peer3', name: 'peer3' };
      let peer4 = { peer: true, endpoint: 'peer4', name: 'peer4' };
      let notPeer1 = { peer: false };
      let notPeer2 = { peer: false };

      let serviceEntry = ServiceEntry.create('New Service2', 3, orchestrator);
      test.expect(serviceEntry.peers).to.be.empty();
      test.expect(Object.keys(serviceEntry.peers).length).to.be(0);

      test.expect(serviceEntry.numPeers).to.be(0);
      test.expect(serviceEntry.peersFulfilled).to.be(false);

      serviceEntry.members = { notPeer1, notPeer2 };
      test.expect(serviceEntry.peers).to.be.empty();
      test.expect(Object.keys(serviceEntry.peers).length).to.be(0);
      test.expect(serviceEntry.numPeers).to.be(0);
      test.expect(serviceEntry.peersFulfilled).to.be(false);

      serviceEntry.members = { peer1, peer2, notPeer1, notPeer2 };
      test.expect(serviceEntry.peers).to.eql({ peer1, peer2 });
      test.expect(serviceEntry.numPeers).to.be(2);
      test.expect(serviceEntry.peersFulfilled).to.be(false);

      serviceEntry.members = { peer1, peer2, peer3, notPeer1, notPeer2 };
      test.expect(serviceEntry.peers).to.eql({ peer1, peer2, peer3 });
      test.expect(serviceEntry.numPeers).to.be(3);
      test.expect(serviceEntry.peersFulfilled).to.be(true);

      serviceEntry.members = { peer1, peer2, peer3, peer4, notPeer1, notPeer2 };
      test.expect(serviceEntry.peers).to.eql({ peer1, peer2, peer3, peer4 });
      test.expect(serviceEntry.numPeers).to.be(4);
      test.expect(serviceEntry.peersFulfilled).to.be(true);
      done();
    });
  });

  context('methods', () => {
    it('tests setEndpoints method', () => {
      let serviceEntry = ServiceEntry.create('New Service2', 3, orchestrator);
      serviceEntry.setEndpoints(['1', '2', '3']);
      test.expect(serviceEntry.endpoints).to.eql(['1', '2', '3']);
    });

    it('tests the cleanupEndpoints method', (done) => {
      let serviceEntry = ServiceEntry.create('New Service2', 3, orchestrator);

      let stopped = false;

      serviceEntry.members = {
        member1: { endpoint: 'member1' },
        member2: { endpoint: 'member2' },
        member3: {
          endpoint: 'member3',
          stop: async () => {
            stopped = true;
          },
        },
      };
      orchestrator.removePeer = async (peer) => {
        try {
          test.expect(peer).to.be(serviceEntry.members.member3);
          test.expect(stopped).to.be(true);
          await test.delay(100); // peer removed is called before member is deleted
          test.expect(serviceEntry.members).to.eql({
            member1: { endpoint: 'member1' },
            member2: { endpoint: 'member2' },
          });
          done();
        } catch (e) {
          done(e);
        }
      };
      serviceEntry.setEndpoints(['member1', 'member2']);
      serviceEntry.cleanupMembers();
    });

    it('tests addMembers method', (done) => {
      let serviceEntry = ServiceEntry.create('New Service2', 3, orchestrator);
      serviceEntry.endpoints = ['member1', 'member2', 'member3'];
      serviceEntry.addMembers();
      test.expect(Object.keys(serviceEntry.members)).to.eql(['member1', 'member2', 'member3']);
      test
        .expect(Object.values(serviceEntry.members).map((mem) => mem.endpoint))
        .to.eql(['member1', 'member2', 'member3']);
      for (let member of Object.values(serviceEntry.members)) {
        test.expect(member).to.be.a(Member);
      }
      serviceEntry.endpoints = ['member1', 'member2', 'member3', 'member4'];
      serviceEntry.addMembers();
      test
        .expect(Object.keys(serviceEntry.members))
        .to.eql(['member1', 'member2', 'member3', 'member4']);
      test
        .expect(Object.values(serviceEntry.members).map((mem) => mem.endpoint))
        .to.eql(['member1', 'member2', 'member3', 'member4']);
      for (let member of Object.values(serviceEntry.members)) {
        test.expect(member).to.be.a(Member);
      }
      done();
    });

    it('tests removeMember method', (done) => {
      let serviceEntry = ServiceEntry.create('New Service2', 3, orchestrator);
      serviceEntry.endpoints = ['member1', 'member2', 'member3'];
      serviceEntry.addMembers();
      test.expect(Object.keys(serviceEntry.members)).to.eql(['member1', 'member2', 'member3']);
      serviceEntry.removeMember(serviceEntry.members.member2);
      test.expect(Object.keys(serviceEntry.members)).to.eql(['member1', 'member3']);
      done();
    });

    it('tests connectionFrom method', async () => {
      let serviceEntry = ServiceEntry.create('New Service2', 3, orchestrator);
      serviceEntry.endpoints = ['member1', 'member2', 'member3'];
      serviceEntry.addMembers();
      serviceEntry.members.member1.connect = () => {};
      await serviceEntry.connectionFrom({ endpoint: 'member1' });
      test
        .expect(Object.values(serviceEntry.members).map((mem) => mem.connectedFrom))
        .to.eql([true, false, false]);
    });

    it('tests disconnectionFrom method', async () => {
      let serviceEntry = ServiceEntry.create('New Service2', 3, orchestrator);
      serviceEntry.endpoints = ['member1', 'member2', 'member3'];
      serviceEntry.addMembers();
      serviceEntry.members.member1.connectedFrom = true;
      test
        .expect(Object.values(serviceEntry.members).map((mem) => mem.connectedFrom))
        .to.eql([true, false, false]);
      await serviceEntry.disconnectionFrom({ endpoint: 'member1' });
      test
        .expect(Object.values(serviceEntry.members).map((mem) => mem.connectedFrom))
        .to.eql([false, false, false]);
    });
  });
});
