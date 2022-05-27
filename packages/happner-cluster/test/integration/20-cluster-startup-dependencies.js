const username = '_ADMIN',
  password = 'happn';
const helpers = {
  client: require('../_lib/client'),
  configuration: require('../_lib/helpers/configuration').create(),
  cluster: require('../_lib/helpers/cluster'),
};
const clearMongoCollection = require('../_lib/clear-mongo-collection');
const getSeq = require('../_lib/helpers/getSeq');
require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  beforeEach('clear mongo collection', function (done) {
    clearMongoCollection('mongodb://127.0.0.1', 'happn-cluster', function () {
      done();
    });
  });

  it('starts up a cluster with no interdependencies, happy path, we ensure we can start and teardown the cluster', async () => {
    const cluster = helpers.cluster.create();

    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getFirst(), 0]), 2000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 1]), 2000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 4]), 3000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 5]), 5000);

    const client = await helpers.client.create(username, password, getSeq.getPort(2)); //Unlike others, membership starts at 0 here

    const result = await client.exchange.component1.use();
    test.expect(result).to.be(1);
    await helpers.client.destroy(client);
    await cluster.destroy();
  });

  it('starts up a cluster with interdependencies, happy path, we ensure the startup order is correct', async () => {
    const cluster = helpers.cluster.create();

    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getFirst(), 0]), 2000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 1]), 2000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 2]), 2000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 3]), 2000);
    await test.delay(5000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 4]), 2000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 5]), 2000);
    await test.delay(5000);
    //check member 2 (depending on member 4) is accessible
    const client = await helpers.client.create(username, password, getSeq.getPort(3));
    const result = await client.exchange.component2.use();
    test.expect(result).to.be(2);
    //check the members started in the correct order
    let values = cluster.events.data.map((item) => item.value);
    test
      .expect(values.indexOf(getSeq.getMeshName(5))) // Member 4 should start
      .to.be.lessThan(values.indexOf(getSeq.getMeshName(3))); // before meber 2
    //check everything started
    values.sort();
    test
      .expect(values)
      .to.eql([
        getSeq.getMeshName(1),
        getSeq.getMeshName(2),
        getSeq.getMeshName(3),
        getSeq.getMeshName(4),
        getSeq.getMeshName(5),
        getSeq.getMeshName(6),
      ]);
    await helpers.client.destroy(client);
    await cluster.destroy();
  });

  it('starts up a cluster with interdependencies, we ensure that members with unsatisfied dependencies are not accessible', async () => {
    const cluster = helpers.cluster.create();

    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getFirst(), 0]), 2000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 1]), 2000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 2]), 2000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 3]), 2000);
    await test.delay(5000);
    const values = cluster.events.data.map((item) => {
      return item.value;
    });
    values.sort();
    test.expect(values).to.eql([getSeq.getMeshName(1), getSeq.getMeshName(2)]);
    let error;
    try {
      //check member 2 is not accessible - as member 4 has not been started
      await helpers.client.create(username, password, getSeq.getPort(3));
    } catch (e) {
      error = e.message;
    }
    test.expect(error).to.be('connect ECONNREFUSED 127.0.0.1:' + getSeq.getPort(3).toString());
    //start member 4 up - this should make member 2 available
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 4]), 6000);

    const client = await helpers.client.create(username, password, getSeq.getPort(3));
    const result = await client.exchange.component2.use();
    test.expect(result).to.be(2);
    //start member 5 up So that we can cleanly destroy cluster
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 5]), 6000);
    await helpers.client.destroy(client);
    await test.delay(2000);

    return cluster.destroy();
  });

  it('starts up a cluster, we inject a component with dependencies - ensure it starts because its existing dependencies are there', async () => {
    const cluster = helpers.cluster.create();

    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getFirst(), 0]), 2000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 1]), 2000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 4]), 7000);
    await cluster.component.inject(1, helpers.configuration.extract(20, 2, 'component2'));
    await test.delay(4000);

    //check member 2 (depending on member 4) is accessible
    const client = await helpers.client.create(username, password, getSeq.getPort(2));
    await test.delay(4000);
    const result = await client.exchange.component2.use();
    test.expect(result).to.be(2);
    await helpers.client.destroy(client);
    return cluster.destroy();
  });

  it('starts up a cluster with interdependencies, we inject a component with dependencies - ensure it start is delayed as it depends on a follow on injected component', async () => {
    const cluster = helpers.cluster.create();

    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getFirst(), 0]), 4000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 1]), 4000);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 5]), 9000); //Need mesh to sttabilize before adding component
    //dont await this - as it will hold up the  test
    cluster.component.inject(1, helpers.configuration.extract(20, 2, 'component2'));
    await test.delay(6000);

    //check component2 (depending on member 4) is not accessible
    let client = await helpers.client.create(username, password, getSeq.getPort(2));
    test.expect(client.exchange.component2).to.be(undefined);
    await helpers.client.destroy(client);
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 4]), 4000);
    await test.delay(6000);
    client = await helpers.client.create(username, password, getSeq.getPort(2));
    test.expect((await client.exchange.component2.is()).initialized).to.be(true);
    test.expect((await client.exchange.component2.is()).started).to.be(true);
    await helpers.client.destroy(client);
    return cluster.destroy();
  });
});
