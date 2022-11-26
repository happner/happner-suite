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
      async.queue((task, cb) => {
        let taskResult, taskError;
        task()
          .then(
            (result) => {
              taskResult = result;
            },
            (error) => {
              taskError = error;
            }
          )
          .finally(() => {
            if (taskError) {
              return cb(taskError);
            }
            cb(null, taskResult);
          });
      }, 1)
    );
  }
  static create(options) {
    return new HashringSemaphore(options);
  }
  lock(key, taskFunc) {
    return new Promise((resolve, reject) => {
      const slot = this.#hashRing.get(key);
      this.#queues[parseInt(slot)].push(taskFunc, (e, result) => {
        if (e) {
          return reject(e);
        }
        resolve(result);
      });
    });
  }
  #defaults(options) {
    let defaultedOptions = _.cloneDeep(options || {});
    if (!defaultedOptions.slots) defaultedOptions.slots = 1;
    return defaultedOptions;
  }
};
