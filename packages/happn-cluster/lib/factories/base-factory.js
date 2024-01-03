module.exports = class BaseFactory {
  #makeables;
  constructor(makeables) {
    this.#makeables = makeables;
  }
  create(componentName, ...args) {
    const makeable = this.#makeables[componentName];
    if (!makeable) {
      throw new Error(`unknown makeable ${componentName}`);
    }
    return new makeable(...args);
  }
};
