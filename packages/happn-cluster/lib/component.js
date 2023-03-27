const Container = require('./container');
module.exports = class HappnerClusterComponent {
  #container;
  constructor(config) {
    this.#container = Container.create(config);
  }
  static create(config) {
    return new HappnerClusterComponent(config);
  }
  async start() {
    this.#container.registerDependencies();
    await this.#container.start();
  }
  async stop() {
    await this.#container.stop();
  }
  get container() {
    return this.#container;
  }
};
