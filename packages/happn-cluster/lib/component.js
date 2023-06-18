const Container = require('./container');
const commons = require('happn-commons');
const Constants = require('./constants/all-constants');
class HappnerClusterComponent extends require('events').EventEmitter {
  #container;
  constructor(config) {
    super();
    this.stop = commons.maybePromisify(this.stop);
    this.#container = Container.create(config);
  }
  get config() {
    if (!this.#container?.dependencies?.happnService) {
      throw new Error('cannot access happnService: container not started yet');
    }
    return this.#container.config;
  }
  get services() {
    if (!this.#container?.dependencies?.happnService) {
      throw new Error('cannot access happnService: container not started yet');
    }
    return this.#container.dependencies.happnService.services;
  }
  get connect() {
    if (!this.#container?.dependencies?.happnService) {
      throw new Error('cannot access happnService: container not started yet');
    }
    return this.#container.dependencies.happnService.connect;
  }
  get happnService() {
    if (!this.#container?.dependencies?.happnService) {
      throw new Error('cannot access happnService: container not started yet');
    }
    return this.#container.dependencies.happnService;
  }
  get peers() {
    if (!this.#container?.dependencies?.clusterPeerService) {
      throw new Error('cannot access clusterPeerService: container not started yet');
    }
    return this.#container.dependencies.clusterPeerService.peerConnectors;
  }
  async start() {
    this.#container.registerDependencies();
    await this.#container.start();
    this.attachToEvents();
    return this;
  }
  async stop(options, cb) {
    if (typeof options === 'function') {
      cb = options;
    }
    let error;
    this.#container
      .stop()
      .catch((e) => {
        error = e;
      })
      .finally(() => {
        if (error) return cb(error);
        cb();
      });
  }
  get container() {
    return this.#container;
  }
  attachToEvents() {
    this.#container.dependencies.clusterPeerService.on(
      Constants.EVENT_KEYS.PEER_CONNECTED,
      (peerInfo) => {
        this.emit(Constants.EVENT_KEYS.PEER_CONNECTED, peerInfo);
      }
    );
    this.#container.dependencies.clusterPeerService.on(
      Constants.EVENT_KEYS.PEER_DISCONNECTED,
      (peerInfo) => {
        this.emit(Constants.EVENT_KEYS.PEER_DISCONNECTED, peerInfo);
      }
    );
  }
}

HappnerClusterComponent.create = commons.maybePromisify((config, cb) => {
  const component = new HappnerClusterComponent(config);
  let error;
  component
    .start()
    .catch((e) => {
      error = e;
    })
    .finally(() => {
      if (error) return cb(error);
      cb(null, component);
    });
});

module.exports = HappnerClusterComponent;
