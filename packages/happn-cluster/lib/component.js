const Container = require('./container');
module.exports = class HappnerClusterComponent {
  #container;
  constructor(config) {
    this.#container = Container.create(config);
  }
  get happnService() {
    if (!this.#container?.dependencies?.happnService) {
      throw new Error('cannot access happnService: container not started yet');
    }
    return this.#container.dependencies.happnService;
  }
  static create(config) {
    return new HappnerClusterComponent(config);
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
};
