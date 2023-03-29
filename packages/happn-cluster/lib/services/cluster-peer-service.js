const ClusterPeerBuilder = require('../builders/cluster-peer-builder');
module.exports = class ClusterPeerService extends require('events').EventEmitter {
  #config;
  #log;
  #localReplicator;
  #peerReplicator;
  #peerConnectors = [];
  #deploymentId;
  #clusterName;
  #peerConnectorFactory;
  #clusterCredentials;
  constructor(config, logger, peerConnectorFactory, localReplicator, peerReplicator) {
    super();
    this.#config = config;
    this.#log = logger;
    this.#peerConnectorFactory = peerConnectorFactory;
    this.#localReplicator = localReplicator;
    this.#peerReplicator = peerReplicator;
  }
  static create(config, logger, peerConnectorFactory, localReplicator, peerReplicator) {
    return new ClusterPeerService(
      config,
      logger,
      peerConnectorFactory,
      localReplicator,
      peerReplicator
    );
  }
  async connectPeer(peerInfo) {
    const connectorPeer = this.#peerConnectorFactory.createPeerConnector(this.#log, peerInfo);
    this.#peerConnectors.push(connectorPeer);
    await connectorPeer.connect(this.#clusterCredentials);
  }
  async disconnect() {
    for (let peerConnector of this.#peerConnectors) {
      try {
        await peerConnector.disconnect();
      } catch (e) {
        this.#log.warn(`failed disconnecting from peer ${peerConnector.memberName}: ${e.message}`);
      }
    }
  }
  async connect(clusterCredentials, peers) {
    this.#clusterCredentials = clusterCredentials;
    this.#deploymentId = clusterCredentials.info.deploymentId;
    this.#clusterName = clusterCredentials.info.clusterName;
    const peerInfoItems = peers.map((peerListItem) => {
      return ClusterPeerBuilder.create()
        .withDeploymentId(this.#deploymentId)
        .withClusterName(this.#clusterName)
        .withServiceName(peerListItem.serviceName)
        .withMemberName(peerListItem.memberName)
        .withMemberHost(peerListItem.memberHost)
        .withMemberPort(peerListItem.memberPort)
        .withMemberStatus(peerListItem.status)
        .build();
    });
    for (const peerInfo of peerInfoItems) {
      await this.connectPeer(peerInfo);
    }
  }
  async parseMemberScanResult(memberScanResult) {
    //TODO: check for new and missing members, add and prune accordingly
  }
  // events that spin the state machine
  onPeerConnected(peerInfo) {}
  onPeerDisconnected(peerInfo) {}
};
