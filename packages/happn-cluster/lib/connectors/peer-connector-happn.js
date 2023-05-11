const Happn = require('happn-3');
const Constants = require('../constants/all-constants');
module.exports = class PeerConnectorHappn extends require('./peer-connector-base') {
  #client;
  #disconnectHandler;
  constructor(logger, peerInfo, disconnectHandler) {
    super(logger, peerInfo);
    this.#disconnectHandler = disconnectHandler;
  }

  get client() {
    return this.#client;
  }

  async connectInternal(clusterCredentials) {
    this.#client = await Happn.client.create({
      host: this.peerInfo.memberHost,
      port: this.peerInfo.memberPort,
      username: clusterCredentials.username,
      password: clusterCredentials.password,
      publicKey: clusterCredentials.publicKey,
      privateKey: clusterCredentials.privateKey,
      info: clusterCredentials.info,
      socket: {
        strategy: 'online',
      },
    });
    this.#client.onEvent(
      Constants.EVENT_KEYS.HAPPN_CLIENT_RECONNECT_SCHEDULED,
      this.onReconnectScheduled
    );
    this.#client.onEvent(Constants.EVENT_KEYS.HAPPN_CLIENT_RECONNECTED, this.onReconnected);
    this.#client.onEvent(
      Constants.EVENT_KEYS.HAPPN_CLIENT_SESSION_ENDED,
      this.onServerSideDisconnect
    );
    this.#client.onEvent(Constants.EVENT_KEYS.HAPPN_CLIENT_CONNECTION_ENDED, this.onDisconnected);
  }

  async disconnectInternal() {
    if (this.#client) {
      await this.#client.disconnect();
    }
  }

  async subscribeInternal(path, handler) {
    return await this.#client.on(path, handler);
  }

  async unsubscribeInternal(path) {
    return await this.#client.offPath(path);
  }

  async onDisconnectedInternal() {
    await this.#disconnectHandler();
  }
};
