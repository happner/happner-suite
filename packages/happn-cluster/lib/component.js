const Container = require('./container');
const commons = require('happn-commons');
class HappnerClusterComponent extends require('events').EventEmitter {
  #container;
  constructor(config) {
    super();
    this.#container = Container.create(config);
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
  static create(config) {
    const component = new HappnerClusterComponent(config);
    return component.start();
  }
  async start() {
    this.#container.registerDependencies();
    await this.#container.start();
    return this;
  }
  async stop() {
    await this.#container.stop();
  }
  get container() {
    return this.#container;
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
