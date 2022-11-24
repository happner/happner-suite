const _ = require('lodash');
const async = require('async');
const HashRing = require('hashring');
module.exports = class HashringSemaphore {
  #options;
  #hashRing;
  #queues;
  #slots;
  constructor(options) {
    this.#options = this.#defaults(options);
    this.#slots = new Array(this.#options.slots).fill().map((_item, itemIndex) => {
      return itemIndex.toString();
    });
    this.#hashRing = new HashRing(this.#slots);
    this.#queues = this.#slots.map(() =>
      async.queue(async (task) => {
        await task();
      })
    );
  }
  static create(options) {
    return new HashringSemaphore(options);
  }
  async lock(key, taskFunc) {
    const slot = this.#hashRing.get(key);
    await this.#queues[parseInt(slot)].push(taskFunc);
  }
  #defaults(options) {
    let defaultedOptions = _.cloneDeep(options || {});
    if (!defaultedOptions.slots) defaultedOptions.slots = 1;
    return defaultedOptions;
  }
};
