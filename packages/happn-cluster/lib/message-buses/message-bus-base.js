/* eslint-disable no-unused-vars */
module.exports = class MessageBusBase extends require('events').EventEmitter {
  #opts;
  constructor(opts) {
    super();
    this.#opts = opts;
  }
  get opts() {
    return this.#opts;
  }
  async initialize() {
    throw new Error('initialize must be overridden');
  }
  async start() {
    throw new Error('start must be overridden');
  }
  async stop() {
    throw new Error('start must be overridden');
  }
  async publish(topic, payload, opts) {
    throw new Error('publish must be overridden');
  }
  async subscribe(topic, opts, handler) {
    throw new Error('subscribe must be overridden');
  }
};
