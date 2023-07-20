/* eslint-disable no-unused-vars */
require('../../lib/test-helper').describe({ timeout: 120e3 }, function (test) {
  it.only('starts, publishes, subscribes, consumes and stops the kafka message bus', async () => {
    const deploymentId = test.commons.uuid.v4();
    const domain = `DOMAIN`;

    const replicationPathsHash1 = test.commons.hashString(
      JSON.stringify(['test/1/2/3', 'test/1/*'])
    );

    const replicationPathsHash2 = test.commons.hashString(
      JSON.stringify(['test/1/2/3', 'test/1/*', 'test/2/*'])
    );

    const topic1 = `${deploymentId}-${domain}-${replicationPathsHash1}`;
    const topic2 = `${deploymentId}-${domain}-${replicationPathsHash2}`;

    const posted = [];

    const messageBusKafka1 = await createMessageBus();
    const messageBusKafka2 = await createMessageBus();

    await messageBusKafka1.subscribe(topic1, { fromBeginning: false }, (payload) => {
      posted.push(payload);
    });

    await messageBusKafka2.subscribe(topic2, { fromBeginning: false }, (payload) => {
      posted.push(payload);
    });

    await messageBusKafka1.start();
    await messageBusKafka2.start();

    await test.delay(5e3);
    await messageBusKafka1.publish(topic2, { test: 1 });
    await test.delay(2e3);
    await messageBusKafka2.publish(topic1, { test: 2 });
    await test.delay(2e3);
    test.expect(posted).to.eql([{ test: 1 }, { test: 2 }]);
    test.log('stopping...');
    await messageBusKafka1.stop();
    await messageBusKafka2.stop();
  });

  async function createMessageBus() {
    const messageBusFactory = require('../../../lib/factories/message-bus-factory').create();
    const messageBusKafka = messageBusFactory.createMessageBusKafka({
      kafka: {
        clientId: test.commons.uuid.v4(),
        brokers: ['localhost:9092'],
      },
    });
    await messageBusKafka.initialize();
    return messageBusKafka;
  }
});
