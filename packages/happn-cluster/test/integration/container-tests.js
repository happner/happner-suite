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

  it('creates and starts 2 containers, stabilises', async () => {
    const container1 = createContainer(12358, 'member1', 'service1', {
      service2: 1,
    });
    const container2 = createContainer(12359, 'member2', 'service2', {
      service1: 1,
    });

    container1.start();
    container2.start();

    await test.delay(6e3);

    test.expect(container1.dependencies['membershipService'].status).to.be(MemberStatuses.STABLE);
    test.expect(container2.dependencies['membershipService'].status).to.be(MemberStatuses.STABLE);

    container1.stop();
    container2.stop();
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
