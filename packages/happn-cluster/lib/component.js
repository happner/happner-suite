const Container = require('./container');
const commons = require('happn-commons');
class HappnerClusterComponent {
  #container;
  constructor(config) {
    this.#container = Container.create(config);
  }
  get services() {
    if (!this.#container?.dependencies?.happnService) {
      throw new Error('cannot access happnService: container not started yet');
    }
    return this.#container.dependencies.happnService.services;
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
