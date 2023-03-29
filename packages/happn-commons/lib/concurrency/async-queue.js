const _ = require('lodash');
const async = require('async');
module.exports = class AsyncQueue {
  #options;
  #queue;
  constructor(options) {
    this.#options = this.#defaults(options);
    this.#queue = async.queue((task, cb) => {
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
    }, this.#options.concurrency);
  }
  static create(options) {
    return new AsyncQueue(options);
  }
  lock(taskFunc) {
    return new Promise((resolve, reject) => {
      this.#queue.push(taskFunc, (e, result) => {
        if (e) {
          return reject(e);
        }
        resolve(result);
      });
    });
  }
  #defaults(options) {
    let defaultedOptions = _.cloneDeep(options || {});
    if (!defaultedOptions.concurrrency) defaultedOptions.concurrrency = 1;
    return defaultedOptions;
  }
};
