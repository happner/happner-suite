require('../../lib/test-helper').describe({ timeout: 120e3 }, function (test) {
  it('initializes and tests the event replicator', async () => {
    const Logger = require('happn-logger');
    Logger.configure();
    const logger = Logger.createLogger(`test-logger`);
    const config = {};
    const deploymentId = test.commons.uuid.v4();
    const domain = `DOMAIN`;

    const replicationSubscriptionCache =
      require('../../../lib/caches/replication-subscription-cache').create(deploymentId, domain);

    const mockedHappnService = {
      localClient: {},
    };

    const eventReplicator = require('../../../lib/replicators/event-replicator').create(
      config,
      logger,
      mockedHappnService,
      replicationSubscriptionCache
    );

    eventReplicator.attachPeerConnector();
    eventReplicator.attachPeerConnector();
  });
});
