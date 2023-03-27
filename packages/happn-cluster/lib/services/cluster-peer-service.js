const PeerInfoBuilder = require('../builders/peer-info-builder');
module.exports = class ClusterPeerService extends require('events').EventEmitter {
  #config;
  #log;
  #localReplicator;
  #peerReplicator;
  #peerConnectors = [];
  #deploymentId;
  #clusterName;
  #peerConnectorFactory;
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
  async connect(deploymentId, clusterName, peers) {
    this.#deploymentId = deploymentId;
    this.#clusterName = clusterName;
    const peerInfoItems = peers.map((peerListItem) => {
      return PeerInfoBuilder.create()
        .withDeploymentId(this.#deploymentId)
        .withClusterName(this.#clusterName)
        .withServiceName(peerListItem.serviceName)
        .withMemberName(peerListItem.memberName)
        .withMemberHost(peerListItem.memberHost)
        .withMemberStatus(peerListItem.status)
        .build();
    });
    for (const peerInfo of peerInfoItems) {
      const connectorPeer = this.#peerConnectorFactory.createPeerConnector(peerInfo);
      this.#peerConnectors.push(connectorPeer);
      await connectorPeer.connect();
    }
  }
  // events that spin the state machine
  onPeerConnected(peerInfo) {}
  onPeerDisconnected(peerInfo) {}
};
