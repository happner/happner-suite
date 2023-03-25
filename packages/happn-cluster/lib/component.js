const Container = require('./container');
module.exports = class HappnerClusterComponent {
  #container;
  constructor() {
    this.#container = Container.create();
  }
  static create() {
    return new HappnerClusterComponent();
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
