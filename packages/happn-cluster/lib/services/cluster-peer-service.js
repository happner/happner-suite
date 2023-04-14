const ClusterPeerBuilder = require('../builders/cluster-peer-builder');
module.exports = class ClusterPeerService extends require('events').EventEmitter {
  #config;
  #log;
  #clusterReplicatorService;
  #peerConnectors = [];
  #deploymentId;
  #clusterName;
  #peerConnectorFactory;
  #clusterCredentials;
  constructor(config, logger, peerConnectorFactory, clusterReplicatorService) {
    super();
    this.#config = config;
    this.#log = logger;
    this.#peerConnectorFactory = peerConnectorFactory;
    this.#clusterReplicatorService = clusterReplicatorService;
  }

  static create(config, logger, peerConnectorFactory, clusterReplicatorService) {
    return new ClusterPeerService(config, logger, peerConnectorFactory, clusterReplicatorService);
  }

  async connectPeer(peerInfo) {
    const connectorPeer = this.#peerConnectorFactory.createPeerConnector(this.#log, peerInfo);
    this.#peerConnectors.push(connectorPeer);
    await connectorPeer.connect(this.#clusterCredentials);
  }

  async disconnect() {
    for (let peerConnector of this.#peerConnectors) {
      await this.#disconnectPeerConnector(peerConnector);
    }
  }

  async #disconnectPeerConnector(peerConnector) {
    try {
      await peerConnector.disconnect();
    } catch (e) {
      // TODO: should we fatal here?
      this.#log.warn(`failed disconnecting from peer ${peerConnector.memberName}: ${e.message}`);
    }
  }

  async removePeers(peers) {
    const peerConnectorsToRemove = this.#peerConnectors.filter((peerConnector) => {
      return peers.find((peer) => peer.memberName === peerConnector.peerInfo.memberName) != null;
    });
    for (let peerConnector of peerConnectorsToRemove) {
      await this.#disconnectPeerConnector(peerConnector);
      this.#peerConnectors.splice(this.#peerConnectors.indexOf(peerConnector), 1);
    }
  }

  listPeerConnectors() {
    return this.#peerConnectors.slice();
  }

  async addPeers(clusterCredentials, peers) {
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
