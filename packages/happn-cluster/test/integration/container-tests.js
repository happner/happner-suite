const Container = require('../../lib/container');
const MemberStatuses = require('../../lib/constants/member-statuses');
require('../lib/test-helper').describe({ timeout: 120e3 }, function (test) {
  let deploymentId;

  beforeEach(() => {
    deploymentId = test.commons.uuid.v4();
  });

  it('creates a container', async () => {
    createContainer(null, null, null, {});
  });

  it('creates and starts a container, stabilise timeout', async () => {
    const container = createContainer();
    try {
      await container.start();
      throw new Error('unexpected success');
    } catch (e) {
      test.expect(e.message).to.equal('discover timeout');
    }
  });

  it('creates and starts 2 containers, stabilises, creates another container - we ensure it can join later', async () => {
    const container1 = createContainer(12358, 'member1', 'service1', {
      service2: 1,
    });
    const container2 = createContainer(12359, 'member2', 'service2', {
      service1: 1,
    });

    container1.start();
    container2.start();

    await test.delay(5e3);

    test.expect(container1.dependencies['membershipService'].status).to.be(MemberStatuses.STABLE);
    test.expect(container2.dependencies['membershipService'].status).to.be(MemberStatuses.STABLE);

    const container3 = createContainer(12360, 'member3', 'service3', {
      service1: 1,
      service2: 1,
    });
    container3.start();

    await test.delay(5e3);

    test.expect(container3.dependencies['membershipService'].status).to.be(MemberStatuses.STABLE);
    const container1PeerConnectors =
      container1.dependencies['clusterPeerService'].listPeerConnectors();
    test.expect(container1PeerConnectors.length).to.be(2);
    test.expect(container1PeerConnectors[0].peerInfo.memberName).to.be('member2');
    test.expect(container1PeerConnectors[1].peerInfo.memberName).to.be('member3');

    container1.stop();
    container2.stop();
    container3.stop();
  });

  it.only('creates and starts 3 containers, stabilises, ensures security directory changes are propagated', async () => {
    const container1 = createContainer(12358, 'member1', 'service1', {
      service2: 1,
    });
    const container2 = createContainer(12359, 'member2', 'service2', {
      service1: 1,
    });
    const container3 = createContainer(12360, 'member3', 'service3', {
      service1: 1,
      service2: 1,
    });

    container1.start();
    container2.start();
    container3.start();

    await test.delay(5e3);

    await test.createUserOnContainer(container1, 'test1', 'password', {
      'test/path/1': { actions: ['*'] },
    });

    await test.delay(5e3);

    const session1 = await test.createSession(12358, 'test1', 'password');
    const session2 = await test.createSession(12359, 'test1', 'password');
    const session3 = await test.createSession(12360, 'test1', 'password');

    let eventData = [];
    await session3.on('test/path/1', (data) => {
      eventData.push(data);
    });

    await session1.set('test/path/1', { test: 1 });
    await session2.set('test/path/1', { test: 1 });

    test.log('removing permission...');
    // remove all user permissions, wait 5 seconds
    await test.updateUserPermissionsOnContainer(
      container1,
      'test1',
      {
        'test/path/1': { remove: true, actions: ['*'] },
      },
      5e3
    );

    let eMessage;
    try {
      await session2.set('test/path/1', { test: 1 });
    } catch (e) {
      eMessage = e.message;
    }

    test.expect(eMessage).to.equal('unauthorized');
    test.expect(eventData.length).to.equal(2);

    await test.destroySessions(session1, session2, session3);

    container1.stop();
    container2.stop();
    container3.stop();
  });

  function createContainer(
    port = 12358,
    name = 'memberName',
    serviceName = 'serviceName',
    dependencies = {
      testService1: 1,
    }
  ) {
    const container = Container.create({
      secure: true,
      port,
      name,
      services: {
        security: {
          config: {
            adminUser: {
              username: '_ADMIN',
              password: 'happn',
            },
          },
        },
        proxy: {
          config: {
            defer: false,
          },
        },
        membership: {
          config: {
            // dynamic (uuid) for the current deployment, so we dont have old membership data being acted on
            deploymentId,
            // a virtual cluster grouping, inside this deployment
            clusterName: 'clusterName',
            // classification for the set of services this member provides, members with the same service name should be identical
            serviceName,
            // the identifier for this member, NB: config.name overrides this in utils/default-name
            memberName: 'memberName',
            // abort start and exit, as dependencies and members not found on startup cycle
            discoverTimeoutMs: 5e3,
            healthReportIntervalMs: 1e3,
            // announce presence every 500ms
            pulseIntervalMs: 5e2,
            // check membership registry every 3 seconds
            memberScanningIntervalMs: 3e3,
            // only stabilise if members with correct services and counts are present
            dependencies,
            // intra-cluster credentials
            clusterUsername: '_CLUSTER',
            clusterPassword: 'PASSWORD',
            // event paths we want to replicate on, in this case everything
            replicationPaths: ['**'],
          },
        },
      },
    });
    container.registerDependencies();
    return container;
  }
});
