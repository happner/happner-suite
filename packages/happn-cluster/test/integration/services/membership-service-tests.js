const ClusterHealthService = require('../../../lib/services/cluster-health-service');
const ClusterPeerService = require('../../../lib/services/cluster-peer-service');
const ClusterSecurityDirectoryReplicationService = require('../../../lib/services/cluster-security-directory-replicator-service');

/* eslint-disable no-unused-vars */
require('../../lib/test-helper').describe({ timeout: 120e3 }, function (test) {
  const MEMBER_STATUSES = require('../../../lib/constants/member-statuses');
  const deploymentId = test.newid();
  const PeerConnectorFactory = require('../../../lib/factories/peer-connector-factory');
  const logger = test.mockLogger();
  const clusterHealthService = ClusterHealthService.create(logger);
  const processManagerService = mockProcessManagerService();
  const peerConnectorFactory = new PeerConnectorFactory({
    'peer-connector': class MockPeerConnector extends require('../../../lib/connectors/peer-connector-base') {
      constructor(logger, peerInfo) {
        super(logger, peerInfo);
      }
      async connectInternal() {
        return true;
      }
      async disconnectInternal() {
        return true;
      }
    },
  });
  it('is able to create and configure and stabilise members', function (done) {
    const happnService = mockHappnService();
    const proxyService = mockProxyService();
    const membershipDbFactory = mockMembershipDbFactory();
    const databaseClient = membershipDbFactory.createMembershipDb(happnService);
    const membershipRegistryRepository =
      require('../../../lib/repositories/membership-registry-repository').create(databaseClient);
    const registryService = require('../../../lib/services/registry-service').create(
      {
        staleMemberThreshold: 10e3,
      },
      membershipRegistryRepository,
      logger
    );
    const clusterPeerService = ClusterPeerService.create(
      {},
      logger,
      peerConnectorFactory,
      ClusterSecurityDirectoryReplicationService.create(
        {},
        logger,
        happnService,
        processManagerService
      )
    );
    const member1 = createMember(
      deploymentId,
      'cluster-1',
      'service-1',
      'member-1',
      {
        'service-2': 1,
        'service-3': 2,
      },
      logger,
      registryService,
      happnService,
      proxyService,
      clusterPeerService,
      clusterHealthService
    );
    test.expect(member1.deploymentId).to.equal(deploymentId);
    test.expect(member1.clusterName).to.equal('cluster-1');
    test.expect(member1.serviceName).to.equal('service-1');
    test.expect(member1.memberName).to.equal('member-1');
    test.expect(member1.dependencies).to.eql({
      'service-2': 1,
      'service-3': 2,
    });

    const member2 = createMember(
      deploymentId,
      'cluster-1',
      'service-2',
      'member-2',
      {
        'service-3': 1,
      },
      logger,
      registryService,
      happnService,
      proxyService,
      clusterPeerService,
      clusterHealthService
    );
    const member3 = createMember(
      deploymentId,
      'cluster-1',
      'service-3',
      'member-3',
      {
        'service-2': 1, //  circular
      },
      logger,
      registryService,
      happnService,
      proxyService,
      clusterPeerService,
      clusterHealthService
    );
    const member4 = createMember(
      deploymentId,
      'cluster-1',
      'service-3',
      'member-4',
      {
        'service-2': 1, // circular
      },
      logger,
      registryService,
      happnService,
      proxyService,
      clusterPeerService,
      clusterHealthService
    );
    member1.on('status-changed', async (status) => {
      if (status !== MEMBER_STATUSES.STABLE) {
        return;
      }
      await test.delay(3e3);
      test.expect(member1.status).to.equal(MEMBER_STATUSES.STABLE); // stabilised
      test.expect(member2.status).to.equal(MEMBER_STATUSES.STABLE); // stabilised
      test.expect(member3.status).to.equal(MEMBER_STATUSES.STABLE); // stabilised
      test.expect(member4.status).to.equal(MEMBER_STATUSES.STABLE); // stabilised
      await stopMember(member1);
      test.expect(member1.status).to.equal(MEMBER_STATUSES.STOPPED); // unintialized
      await stopMember(member2);
      test.expect(member2.status).to.equal(MEMBER_STATUSES.STOPPED); // unintialized
      await stopMember(member3);
      test.expect(member3.status).to.equal(MEMBER_STATUSES.STOPPED); // unintialized
      await stopMember(member4);
      test.expect(member4.status).to.equal(MEMBER_STATUSES.STOPPED); // unintialized
      done();
    });
    test.expect(member1.status).to.equal(MEMBER_STATUSES.STOPPED); // unintialized
    member1.start();
    test.delay(2e3).then(() => {
      test.expect(member1.status).to.equal(MEMBER_STATUSES.DISCOVERING); // pending
      member2.start();
      member3.start();
      member4.start();
    });
  });

  it('fails to stabilise on time', async () => {
    const happnService = mockHappnService();
    const proxyService = mockProxyService();
    const membershipDbFactory = mockMembershipDbFactory();
    const databaseClient = membershipDbFactory.createMembershipDb(happnService);
    const membershipRegistryRepository =
      require('../../../lib/repositories/membership-registry-repository').create(databaseClient);
    const registryService = require('../../../lib/services/registry-service').create(
      {
        staleMemberThreshold: 10e3,
      },
      membershipRegistryRepository,
      logger
    );
    const clusterPeerService = ClusterPeerService.create(
      {},
      logger,
      peerConnectorFactory,
      ClusterSecurityDirectoryReplicationService.create(
        {},
        logger,
        happnService,
        processManagerService
      )
    );
    const member1 = createMember(
      deploymentId,
      'cluster-1',
      'service-1',
      'member-1',
      {
        'service-2': 1,
        'service-3': 2,
      },
      logger,
      registryService,
      happnService,
      proxyService,
      clusterPeerService,
      clusterHealthService,
      2e3
    );
    try {
      await member1.start();
      throw new Error('unexpected success');
    } catch (e) {
      test.expect(e.message).to.equal('discover timeout');
      await stopMember(member1);
    }
  });

  function stopMember(memberToStop) {
    return new Promise((resolve, reject) => {
      memberToStop.stop({}, (e) => {
        if (e) {
          return reject(e);
        }
        resolve();
      });
    });
  }

  function createMember(
    deploymentId,
    clusterName,
    serviceName,
    memberName,
    dependencies,
    logger,
    registryService,
    happnService,
    proxyService,
    clusterPeerService,
    clusterHealthService,
    discoverTimeoutMs = 10e3, // emits a stabilise timeout event if not healthy in 5 seconds
    healthReportIntervalMs = 1e3, // prints health every 5 seconds
    pulseIntervalMs = 500 // updates membership registryService every 500ms
  ) {
    //config, logger, registryService, happnService, proxyService, peerConnectorFactory
    return require('../../../lib/services/membership-service').create(
      {
        name: memberName,
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
              deploymentId,
              clusterName,
              serviceName,
              memberName,
              discoverTimeoutMs,
              healthReportIntervalMs,
              pulseIntervalMs,
              dependencies,
            },
          },
        },
      },
      logger,
      registryService,
      happnService,
      proxyService,
      clusterPeerService,
      clusterHealthService,
      processManagerService
    );
  }
  function mockMembershipDbFactory() {
    class MembershipDbMockProvider extends require('../../../lib/providers/membership-db-base-provider') {
      #membersDb = [];
      #membersDbIndex = {};
      constructor() {
        super();
      }
      // eslint-disable-next-line no-unused-vars
      async get(path, options) {
        return this.#membersDb.filter((item) => {
          return (
            item.data.timestamp >= options.criteria['data.timestamp'].$gte &&
            item.data.path.indexOf(path.replace('/_SYSTEM/DEPLOYMENT/', '').replace('/*', '')) === 0
          );
        });
      }
      // eslint-disable-next-line no-unused-vars
      async upsert(path, memberEntry) {
        if (this.#membersDbIndex[path] == null) {
          this.#membersDb.push({ data: memberEntry });
          this.#membersDbIndex[path] = this.#membersDb.length - 1;
        } else {
          this.#membersDb.splice(this.#membersDbIndex[path], 1, { data: memberEntry });
        }
        return this.#membersDbIndex[path];
      }
    }
    const MembershipDbFactory = require('../../../lib/factories/membership-db-factory');
    return new MembershipDbFactory({
      'membership-db-provider': MembershipDbMockProvider,
    });
  }
  function mockHappnService() {
    return {
      start: test.sinon.stub().callsFake(async (membershipService, proxyService) => {}),
      stop: test.sinon.stub(),
      on: test.sinon.stub(),
    };
  }
  function mockProxyService() {
    return {
      start: test.sinon.stub(),
      stop: test.sinon.stub(),
      internalHost: '0.0.0.0',
      internalPort: 0,
    };
  }
  function mockProcessManagerService() {
    return {
      fatal: test.sinon.stub(),
    };
  }
});
