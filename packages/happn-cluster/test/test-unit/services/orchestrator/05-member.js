const Member = require('../../../../lib/services/orchestrator/member');
const orchestrator = require('../../../mocks/test-unit/mock-orchestrator');
require('../../../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
  context('create', () => {
    it('can create an instance of Member (constructor, no IP match)', (done) => {
      let member = new Member({ endpoint: '1.2.3.5:4321' }, orchestrator);
      delete member.HappnClient;
      test.expect(member).to.eql({
        orchestrator,
        log: orchestrator.log,
        name: undefined,
        endpoint: '1.2.3.5:4321',
        address: '1.2.3.5',
        port: '4321',
        serviceName: undefined,
        self: false,
        connectingTo: false,
        connectedTo: false,
        connectedFrom: false,
        client: null,
        subscribingTo: false,
        subscribedTo: false,
        listedAsPeer: false,
        reservedMeta,
      });
      done();
    });

    it('can create an instance of Member (constructor, IPs match, i.e. member  = self)', (done) => {
      let member = new Member({ endpoint: '1.2.3.4:5678' }, orchestrator);
      delete member.HappnClient;
      test.expect(member).to.eql({
        orchestrator,
        listedAsPeer: false,
        log: orchestrator.log,
        name: 'orch01',
        endpoint: '1.2.3.4:5678',
        address: '1.2.3.4',
        port: '5678',
        serviceName: undefined,
        self: true,
        connectingTo: false,
        connectedTo: true,
        connectedFrom: true,
        client: orchestrator.localClient,
        subscribingTo: false,
        subscribedTo: true,
        reservedMeta,
      });
      done();
    });

    it('can create an instance of Member (create method, nno IP match)', (done) => {
      let member = Member.create(
        { endpoint: '1.2.3.5:4321', serviceName: 'MY-SERVICE', name: 'MY-NAME' },
        orchestrator
      );
      delete member.HappnClient;

      test.expect(member).to.eql({
        orchestrator,
        log: orchestrator.log,
        name: 'MY-NAME',
        endpoint: '1.2.3.5:4321',
        address: '1.2.3.5',
        port: '4321',
        serviceName: 'MY-SERVICE',
        self: false,
        connectingTo: false,
        connectedTo: false,
        connectedFrom: false,
        client: null,
        subscribingTo: false,
        subscribedTo: false,
        listedAsPeer: false,
        reservedMeta,
      });
      done();
    });
  });

  context('get', () => {
    it('Test the connected getter ', (done) => {
      let member = Member.create({ endpoint: '1.2.3.5:4321' }, orchestrator);
      test.expect(member.connected).to.be(false);

      member.connectedTo = true;
      test.expect(member.connected).to.be(false);

      member.connectedFrom = true;
      test.expect(member.connected).to.be(true);

      member.connectedTo = false;
      test.expect(member.connected).to.be(false);
      done();
    });

    it('Test the readyToSubscribe getter ', (done) => {
      let member = Member.create({ endpoint: '1.2.3.5:4321' }, orchestrator);
      setMember(member, { connectedTo: false, subscribingTo: false, subscribedTo: false });
      test.expect(member.readyToSubscribe).to.be(false);
      setMember(member, { connectedTo: true, subscribingTo: false, subscribedTo: false });
      test.expect(member.readyToSubscribe).to.be(true);
      setMember(member, { connectedTo: true, subscribingTo: true, subscribedTo: false });
      test.expect(member.readyToSubscribe).to.be(false);
      setMember(member, { connectedTo: true, subscribingTo: false, subscribedTo: true });
      test.expect(member.readyToSubscribe).to.be(false);

      done();
    });

    it('Test the peer getter ', (done) => {
      let member = Member.create({ endpoint: '1.2.3.5:4321' }, orchestrator);
      setMember(member, {
        name: 'member',
        connectedTo: true,
        connectedFrom: true,
        subscribedTo: true,
        error: null,
      });
      test.expect(member.peer).to.be(true);
      setMember(member, {
        name: '',
        connectedTo: true,
        connectedFrom: true,
        subscribedTo: true,
        error: null,
      });
      test.expect(member.peer).to.be(false);
      setMember(member, {
        name: undefined,
        connectedTo: true,
        connectedFrom: true,
        subscribedTo: true,
        error: null,
      });
      test.expect(member.peer).to.be(false);
      setMember(member, {
        name: 'member',
        connectedTo: false,
        connectedFrom: true,
        subscribedTo: true,
        error: null,
      });
      test.expect(member.peer).to.be(false);
      setMember(member, {
        name: 'member',
        connectedTo: true,
        connectedFrom: false,
        subscribedTo: true,
        error: null,
      });
      test.expect(member.peer).to.be(false);
      setMember(member, {
        name: 'member',
        connectedTo: true,
        connectedFrom: true,
        subscribedTo: false,
        error: null,
      });
      test.expect(member.peer).to.be(false);
      setMember(member, {
        name: 'member',
        connectedTo: true,
        connectedFrom: true,
        subscribedTo: true,
        error: new Error('bad'),
      });
      test.expect(member.peer).to.be(false);

      done();
    });
  });

  context('methods', () => {
    it('test the updateOwnInfo method', (done) => {
      let member = Member.create({ endpoint: '1.2.3.5:4321' }, orchestrator);
      member.updateOwnInfo({
        name: 'member1',
      });
      test.expect(member.name).to.be('member1');
      member.updateOwnInfo({
        endpoint: '9.8.7.6:543',
        serviceName: 'SomeService',
      });
      test.expect(member.endpoint).to.be('9.8.7.6:543');
      test.expect(member.address).to.be('9.8.7.6');
      test.expect(member.port).to.be('543');
      test.expect(member.serviceName).to.be('SomeService');

      done();
    });

    it('test connection from method', (done) => {
      let member = Member.create({ endpoint: '1.2.3.5:4321' }, orchestrator);
      member.connect = () => {
        test.expect(member.name).to.be('member2');
        test.expect(member.endpoint).to.be('9.8.7.6:543');
        test.expect(member.address).to.be('9.8.7.6');
        test.expect(member.port).to.be('543');
        test.expect(member.connectedFrom).to.be(true);
        done();
      };
      member.connectionFrom({
        name: 'member2',
        endpoint: '9.8.7.6:543',
      });
    });

    it('test __subscribe  method returns early if no path', (done) => {
      let member = Member.create({ endpoint: '1.2.3.5:4321' }, orchestrator);
      member.client = {
        on: () => {
          done(new Error('Test Error: should not be called'));
        },
      };
      member.__subscribe();
      member.__subscribe('');
      member.__subscribe(null);
      done();
    });

    it('test __subscribe  method, proper call', (done) => {
      let member = Member.create({ endpoint: '1.2.3.5:4321' }, orchestrator);
      member.client = {
        on: (path, opts, func) => {
          test.expect(path).to.be('path');
          test.expect(opts).to.be(null);
          test.expect(typeof func).to.be('function');
          done();
        },
      };
      member.__subscribe('path');
    });

    it('test subscribe  method, proper call', async () => {
      let member = Member.create({ endpoint: '1.2.3.5:4321' }, orchestrator);
      member.connectedTo = true;
      member.client = {
        on: (path, opts, func) => {
          test.expect(path).to.be('*');
          test.expect(opts).to.be(null);
          test.expect(typeof func).to.be('function');
          test.expect(member.subscribingTo).to.be(true);
        },
      };
      await member.subscribe();
      test.expect(member.subscribingTo).to.be(false);
      test.expect(member.subscribedTo).to.be(true);
    });

    it('test connect  method, proper call', async () => {
      let member = Member.create({ endpoint: '1.2.3.5:4321' }, orchestrator);
      let events = [];
      let client = {
        Happn: 'client',
        onEvent: (event) => {
          events.push(event);
          return events.length;
        },
        serverInfo: {
          name: 'server name',
        },
      };
      member.orchestrator.HappnClient = {
        create: () => {
          return client;
        },
      };
      await member.connect({});
      test.expect(member.client).to.eql(client);
      test.expect(member.connectedTo).to.be(true);
      test
        .expect(events)
        .to.eql([
          'server-side-disconnect',
          'connection-ended',
          'reconnect-scheduled',
          'reconnect-successful',
        ]);
      test
        .expect([
          member.__disconnectServerSide,
          member.__disconnectSubscriptionId,
          member.__retryConnectSubscriptionId,
          member.__reconnectSubscriptionId,
        ])
        .to.eql([1, 2, 3, 4]);
    });
  });

  context('errors', function () {
    it('sets error on login error', async function () {
      let member = Member.create({ endpoint: '1.2.3.5:4321', name: 'name' }, orchestrator);
      let err = new Error('TEST ERROR');
      try {
        member.client = {
          create: () => {
            throw err;
          },
        };
        await member.connect({});
      } catch (e) {
        test.expect(e.toString()).to.eql('Error: TEST ERROR');
        test.expect(orchestrator.log.fatal.calledOnce).to.be(true);
        test.expect(member.error).to.eql('TEST ERROR');
        test
          .expect(
            orchestrator.log.fatal.calledWith(
              'could not subscribe to %s at %s',
              'path',
              'name',
              err
            )
          )
          .to.be(true);
      }
    });

    it('test __subscribe  method subscription error sets member error as well', async () => {
      orchestrator.log.fatal = test.sinon.spy();
      let member = Member.create({ endpoint: '1.2.3.5:4321', name: 'name' }, orchestrator);
      let err = new Error('TEST ERROR');
      try {
        member.client = {
          on: () => {
            throw err;
          },
        };
        await member.__subscribe('path');
        throw new Error("SHOULDN'T GET HERE");
      } catch (e) {
        test.expect(e.toString()).to.eql('Error: TEST ERROR');
        test.expect(orchestrator.log.fatal.calledOnce).to.be(true);
        test
          .expect(
            orchestrator.log.fatal.calledWith(
              'could not subscribe to %s at %s',
              'path',
              'name',
              err
            )
          )
          .to.be(true);
      }
    });

    it('test subscribe  method subscription error sets member error as well', async () => {
      orchestrator.log.fatal = test.sinon.spy();
      let member = Member.create({ endpoint: '1.2.3.5:4321', name: 'name' }, orchestrator);
      member.connectedTo = true;
      let err = new Error('TEST ERROR');
      member.client = {
        on: () => {
          throw err;
        },
      };
      await member.subscribe();

      test.expect(orchestrator.log.fatal.calledOnce).to.be(true);
      test.expect(member.error).to.eql(err);
      test
        .expect(
          orchestrator.log.fatal.calledWith('could not subscribe to %s at %s', '*', 'name', err)
        )
        .to.be(true);
    });
  });

  function setMember(member, settings) {
    Object.entries(settings).forEach(([key, value]) => {
      member[key] = value;
    });
  }
  let reservedMeta = [
    'created',
    'modified',
    'path',
    'type',
    'status',
    'published',
    'eventId',
    'sessionId',
    'action',
    'channel',
    'sessionId',
    'consistency',
    'publicationId',
  ];
});
