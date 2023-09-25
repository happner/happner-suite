const Container = require('./container');
const Constants = require('./constants/all-constants');
class HappnerClusterComponent extends require('events').EventEmitter {
  #container;
  constructor(config) {
    super();
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

  // ugly - but this interface needs to satisfy happner-cluster
  stop(options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }

    // stop is a promise
    if (!cb) return this.#container.stop(options);

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

// also ugly - but this interface needs to satisfy happner-cluster
HappnerClusterComponent.create = (config, cb) => {
  if (typeof config === 'function') {
    cb = config;
    config = {};
  }
  const component = new HappnerClusterComponent(config);
  if (!cb) return component.start();

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
};

module.exports = HappnerClusterComponent;
