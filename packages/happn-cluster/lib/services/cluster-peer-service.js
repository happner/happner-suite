const ClusterPeerBuilder = require('../builders/cluster-peer-builder');
const Constants = require('../constants/all-constants');
module.exports = class ClusterPeerService extends require('events').EventEmitter {
  #config;
  #log;
  #eventReplicator;
  #peerConnectors = [];
  #deploymentId;
  #clusterName;
  #peerConnectorFactory;
  #clusterCredentials;
  constructor(config, logger, peerConnectorFactory, eventReplicator) {
    super();
    this.#config = config;
    this.#log = logger;
    this.#peerConnectorFactory = peerConnectorFactory;
    this.#eventReplicator = eventReplicator;
  }

  static create(config, logger, peerConnectorFactory, clusterReplicatorService) {
    return new ClusterPeerService(config, logger, peerConnectorFactory, clusterReplicatorService);
  }

  get peerCount() {
    return this.#peerConnectors.length;
  }

  get peerConnectors() {
    return this.#peerConnectors;
  }

  async #peerDisconnected(peerInfo) {
    const peerConnectorToRemove = this.#peerConnectors.find(
      (peerConnector) => peerInfo.memberName === peerConnector.peerInfo.memberName
    );
    this.#peerConnectors.splice(this.#peerConnectors.indexOf(peerConnectorToRemove), 1);
  }

  async #connectPeerConnector(peerInfo) {
    const connectedOldPeer = this.#peerConnectors.find(
      (oldPeer) => oldPeer.peerInfo.memberName === peerInfo.memberName
    );
    if (connectedOldPeer !== undefined) {
      this.#log.warn(
        `duplicate peer is connecting: ${peerInfo.memberName} - not adding to list of peers`
      );
      return;
    }
    // TODO: check for connector with same name - and just reconnect it
    const peerConnector = this.#peerConnectorFactory.createPeerConnector(this.#log, peerInfo, () =>
      this.#peerDisconnected(peerInfo)
    );
    this.#peerConnectors.push(peerConnector);
    await peerConnector.connect(this.#clusterCredentials);
    await this.#eventReplicator.attachPeerConnector(peerConnector);
    this.emit(Constants.EVENT_KEYS.PEER_CONNECTED, peerConnector.peerInfo);
  }

  async disconnect() {
    this.removeAllListeners();
    for (let peerConnector of this.#peerConnectors) {
      await this.#disconnectPeerConnector(peerConnector);
    }
  }

  async #disconnectPeerConnector(peerConnector) {
    try {
      await peerConnector.disconnect();
      this.emit(Constants.EVENT_KEYS.PEER_DISCONNECTED, peerConnector.peerInfo);
    } catch (e) {
      // TODO: should we fatal here?
      this.#log.warn(
        `failed disconnecting from peer ${peerConnector.peerInfo.memberName}: ${e.message}`
      );
    }
  }

  async removePeers(peers) {
    const peerConnectorsToRemove = this.#peerConnectors.filter((peerConnector) => {
      return peers.some((peer) => peer.memberName === peerConnector.peerInfo.memberName);
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
      await this.#connectPeerConnector(peerInfo);
    }
  }

  async processMemberScanResult(memberScanResult) {
    const skipMembers = [
      ...memberScanResult.missingSinceLastMembers.map((peer) => peer.memberName),
      ...this.peerConnectors.map((peerConnector) => peerConnector.peerInfo.memberName),
    ];
    const filteredCurrentMembers = memberScanResult.currentMembers.filter(
      (currentMember) => !skipMembers.includes(currentMember.memberName)
    );
    if (filteredCurrentMembers.length > 0) {
      await this.addPeers(this.#clusterCredentials, memberScanResult.currentMembers);
    }
    if (memberScanResult.missingSinceLastMembers.length > 0) {
      await this.removePeers(memberScanResult.missingSinceLastMembers);
    }
  }
};
