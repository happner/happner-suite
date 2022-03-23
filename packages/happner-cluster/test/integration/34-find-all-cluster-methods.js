require('../_lib/test-helper').describe({ timeout: 60e3, only: true }, (test) => {
  const helpers = {
    client: require('../_lib/client'),
    configuration: require('../_lib/helpers/configuration').create(),
    cluster: require('../_lib/helpers/cluster'),
    getSeq: require('../_lib/helpers/getSeq'),
  };
  let client,
    username = '_ADMIN',
    password = 'happn',
    cluster;
  before('it starts the cluster', startCluster);
  before('it connects the client', connectClient);
  it('can reach methods inside the cluster', callMethods);
  after('it disconnects the client', disconnectClient);
  after('it stops the cluster', stopCluster);

  async function startCluster() {
    cluster = helpers.cluster.create();
    await cluster.member.start(
      helpers.configuration.construct(34, [helpers.getSeq.getFirst(), 0], true, 1),
      2000
    );
    await cluster.member.start(
      helpers.configuration.construct(34, [helpers.getSeq.getNext(), 1], true, 1),
      2000
    );
    await cluster.member.start(
      helpers.configuration.construct(34, [helpers.getSeq.getNext(), 2], true, 1),
      6000
    );
  }

  async function connectClient() {
    client = await helpers.client.create(username, password, helpers.getSeq.getPort(3));
  }

  async function callMethods() {
    test.expect(await client.exchange.component2.method()).to.be(3);
  }

  async function disconnectClient() {
    await helpers.client.destroy(client);
  }

  async function stopCluster() {
    await cluster.destroy();
  }
});
