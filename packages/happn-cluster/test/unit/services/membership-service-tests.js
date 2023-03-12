/* eslint-disable no-unused-vars */
require('../../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
  const MEMBER_STATUSES = require('../../../lib/constants/member-statuses');
  const deploymentId = test.newid();
  const queue = require('async').queue;
  const PeerConnectorFactory = require('../../../lib/factories/peer-connector-factory');
  it.only('is able to create and configure the membership service', function (done) {
    const registry = mockRegistry();
    const peerConnectorFactory = new PeerConnectorFactory({
      'peer-connector': class MockPeerConnector {
        static create() {
          return new MockPeerConnector();
        }
        async connectInternal() {
          return true;
        }
      },
    });
    const member1 = createMember(
      deploymentId,
      'cluster-1',
      'service-1',
      'member-1',
      {
        'service-2': 1,
        'service-3': 2,
      },
      registry,
      peerConnectorFactory
    );
    const member2 = createMember(
      deploymentId,
      'cluster-1',
      'service-2',
      'member-2',
      {
        'service-3': 1,
      },
      registry,
      peerConnectorFactory
    );
    const member3 = createMember(
      deploymentId,
      'cluster-1',
      'service-3',
      'member-3',
      {
        'service-2': 1, //  circular
      },
      registry,
      peerConnectorFactory
    );
    const member4 = createMember(
      deploymentId,
      'cluster-1',
      'service-3',
      'member-4',
      {
        'service-2': 1, // circular
      },
      registry,
      peerConnectorFactory
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
      member1.stop();
      test.expect(member1.status).to.equal(MEMBER_STATUSES.STOPPED); // unintialized
      member2.stop();
      test.expect(member2.status).to.equal(MEMBER_STATUSES.STOPPED); // unintialized
      member3.stop();
      test.expect(member3.status).to.equal(MEMBER_STATUSES.STOPPED); // unintialized
      member4.stop();
      test.expect(member4.status).to.equal(MEMBER_STATUSES.STOPPED); // unintialized
      done();
    });
    test.expect(member1.status).to.equal(MEMBER_STATUSES.STOPPED); // unintialized
    member1.start();
    test.expect(member1.status).to.equal(MEMBER_STATUSES.DISCOVERING); // pending
    member2.start();
    member3.start();
    member4.start();
  });

  function mockRegistry(staleMemberThreshold = 5e3) {
    class MockRegistry extends require('Events').EventEmitter {
      #membersDb = [];
      #membersDbIndex = {};
      #pulse;
      constructor() {
        super();
        this.#pulse = queue(
          (
            { deploymentId, clusterName, serviceName, memberName, memberHost, status },
            callback
          ) => {
            const path = `${deploymentId}/${clusterName}/${serviceName}/${memberName}`;
            let memberEntry = {
              path,
              memberHost,
              timestamp: Date.now(),
              status,
            };
            if (this.#membersDbIndex[path] == null) {
              this.#membersDb.push(memberEntry);
              this.#membersDbIndex[path] = this.#membersDb.length - 1;
            } else {
              this.#membersDb.splice(this.#membersDbIndex[path], 1, memberEntry);
            }
            callback();
          },
          1
        );
        this.pulse = test.sinon
          .stub()
          .callsFake((deploymentId, clusterName, serviceName, memberName, memberHost, status) => {
            return new Promise((resolve, reject) => {
              this.#pulse.push(
                {
                  deploymentId,
                  clusterName,
                  serviceName,
                  memberName,
                  memberHost,
                  status,
                },
                (e, result) => {
                  if (e) {
                    return reject(e);
                  }
                  resolve(result);
                }
              );
            });
          });
        this.list = test.sinon
          .stub()
          .callsFake(async (deploymentId, clusterName, excludeMemberName, statuses) => {
            let items = this.#membersDb.filter((item) => {
              return (
                Date.now() - item.timestamp <= staleMemberThreshold &&
                item.path.indexOf(`${deploymentId}/${clusterName}/`) === 0
              );
            });
            if (excludeMemberName) {
              // exclude the member
              items = items.filter((item) => !item.path.includes(`/${excludeMemberName}`));
            }
            if (statuses) {
              items = items.filter((item) => statuses.includes(item.status));
            }
            return items.map((item) => {
              const itemPathProperties = item.path.split('/');
              return {
                ...item,
                deploymentId,
                clusterName,
                serviceName: itemPathProperties[2],
                memberName: itemPathProperties[3],
                memberHost: itemPathProperties[4],
              };
            });
          });
        this.scan = test.sinon
          .stub()
          .callsFake(async (deploymentId, clusterName, dependencies, memberName, statuses) => {
            const currentMembers = await this.list(deploymentId, clusterName, memberName, statuses);
            let scanResult = Object.keys(dependencies).every((serviceName) => {
              let expectedCount = dependencies[serviceName];
              let foundCount = currentMembers.filter((item) => {
                return item.path.indexOf(`${deploymentId}/${clusterName}/${serviceName}/`) === 0;
              }).length;
              return foundCount <= expectedCount;
            });
            return scanResult;
          });
      }
    }
    return new MockRegistry();
  }

  function createMember(
    deploymentId,
    clusterName,
    serviceName,
    memberName,
    dependencies,
    registry,
    peerConnectorFactory
  ) {
    return require('../../../lib/services/membership-service').create(
      {
        deploymentId,
        clusterName,
        serviceName,
        memberName,
        discoverTimeoutMs: 10e3, // emits a stabilise timeout event if not healthy in 5 seconds
        healthReportIntervalMs: 5e3, // prints health every 5 seconds
        pulseIntervalMs: 500, // updates membership registry every 500ms
        dependencies,
      },
      registry,
      peerConnectorFactory
    );
  }
});
