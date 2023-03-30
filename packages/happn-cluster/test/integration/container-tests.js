const Container = require('../../lib/container');
const MemberStatuses = require('../../lib/constants/member-statuses');
require('../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
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

  function createContainer(
    port = 12358,
    name = 'memberName',
    serviceName = 'serviceName',
    dependencies = {
      testService1: 1,
    }
  ) {
    const container = Container.create({
      port,
      name,
      services: {
        proxy: {
          config: {
            defer: false,
          },
        },
        membership: {
          config: {
            deploymentId,
            clusterName: 'clusterName',
            serviceName,
            memberName: 'memberName',
            discoverTimeoutMs: 5e3,
            healthReportIntervalMs: 1e3,
            pulseIntervalMs: 5e2,
            dependencies,
          },
        },
      },
    });
    container.registerDependencies();
    return container;
  }
});
