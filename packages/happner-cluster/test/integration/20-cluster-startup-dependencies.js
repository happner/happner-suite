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
    const mesh0Index = getSeq.getFirst();
    const mesh1Index = getSeq.getNext();
    const mesh2Index = getSeq.getNext();
    const mesh3Index = getSeq.getNext();
    const mesh4Index = getSeq.getNext();
    const mesh5Index = getSeq.getNext();
    // start member 0
    await cluster.member.start(helpers.configuration.construct(20, [mesh0Index, 0]), 0, 1e3);
    // start member 1
    await cluster.member.start(helpers.configuration.construct(20, [mesh1Index, 1]), 0, 1e3);
    // start member 2, depends on 4
    await cluster.member.start(helpers.configuration.construct(20, [mesh2Index, 2]), 0, 1e3);
    // start member 3, depends on 5
    await cluster.member.start(helpers.configuration.construct(20, [mesh3Index, 3]), 0, 1e3);
    await test.delay(6e3); // sizeable delay
    // start member 4
    await cluster.member.start(helpers.configuration.construct(20, [mesh4Index, 4]), 0, 7e3);
    // start member 5
    await cluster.member.start(helpers.configuration.construct(20, [mesh5Index, 5]), 0, 7e3);
    await test.delay(6e3);
    //check member 2 (depending on member 4) is accessible
    const client = await helpers.client.create(username, password, getSeq.getPort(3));
    const result = await client.exchange.component2.use();
    test.expect(result).to.be(2);

    const mesh2StartTime = cluster.events.data.find((item) => {
      return item.value === `MESH_${mesh2Index[1]}`;
    }).timestamp;
    const mesh3StartTime = cluster.events.data.find((item) => {
      return item.value === `MESH_${mesh3Index[1]}`;
    }).timestamp;
    const mesh4StartTime = cluster.events.data.find((item) => {
      return item.value === `MESH_${mesh4Index[1]}`;
    }).timestamp;
    const mesh5StartTime = cluster.events.data.find((item) => {
      return item.value === `MESH_${mesh5Index[1]}`;
    }).timestamp;

    // so 2 and 4 and 3 and 5 needed to start in proximity to each other
    test.expect(Math.abs(mesh2StartTime - mesh4StartTime)).to.be.lessThan(3e3);
    test.expect(Math.abs(mesh3StartTime - mesh5StartTime)).to.be.lessThan(3e3);

    //check the members started in the correct order
    let values = cluster.events.data.map((item) => item.value);

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

  it('starts up a cluster with interdependencies, with intra-mesh dependencies', async () => {
    const cluster = helpers.cluster.create();
    // start member 4
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getFirst(), 4]), 0, 1e3);
    // start member 5
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 5]), 0, 1e3);
    // start member 6
    await cluster.member.start(helpers.configuration.construct(20, [getSeq.getNext(), 6]), 0, 1e3);

    test.log(`waiting 16 seconds...`);
    await test.delay(16e3);
    //check member 2 (depending on member 4) is accessible
    const client = await helpers.client.create(username, password, getSeq.getPort(3));
    const result = await client.exchange.component6.use();
    test.expect(result).to.be(6);
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
