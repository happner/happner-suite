require('../../lib/test-helper').describe({ timeout: 120e3 }, function (test) {
  it('initializes and tests the event replicator', async () => {
    const Logger = require('happn-logger');
    Logger.configure();
    const logger = Logger.createLogger(`test-logger`);
    const config = {};
    const deploymentId = test.commons.uuid.v4();
    const domain = `DOMAIN`;

    const replicationSubscriptionLookup =
      require('../../../lib/lookups/replication-subscription-lookup').create(deploymentId, domain);

    const mockedHappnService = {
      localClient: {},
      on: test.sinon.stub(),
    };

    const mockedProcessManager = {
      fatal: test.log,
    };

    const mockedMessageBus = {};

    const eventReplicator = require('../../../lib/replicators/event-replicator').create(
      config,
      logger,
      mockedHappnService,
      mockedMessageBus,
      replicationSubscriptionLookup,
      mockedProcessManager
    );

    eventReplicator.attachPeerConnector({
      peerInfo: {},
    });
    eventReplicator.attachPeerConnector({
      peerInfo: {},
    });
  });
});
