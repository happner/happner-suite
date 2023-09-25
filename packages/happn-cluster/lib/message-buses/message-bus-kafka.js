/* eslint-disable no-unused-vars */
const commons = require('happn-commons');
module.exports = class MessageBusKafka extends require('./message-bus-base') {
  #kafka;
  #producer;
  #consumer;
  #handlers = {};
  #stopped = false;
  constructor(opts) {
    process.env.KAFKAJS_NO_PARTITIONER_WARNING = 1;
    super(MessageBusKafka.#defaults(opts));
  }
  async initialize() {
    const { Kafka } = require('kafkajs');
    this.#kafka = new Kafka(this.opts.kafka);
    this.#producer = this.#kafka.producer();
    await this.#producer.connect();
    this.#consumer = this.#kafka.consumer({ groupId: this.opts.consumerGroupId });
    await this.#consumer.connect();
  }
  async start() {
    await this.#consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageJSON = this.parseMessage(topic, message);
        if (messageJSON === null || messageJSON.opts?.ignore === true) {
          return;
        }
        for (const handler of this.#handlers[topic]) {
          try {
            if (handler.opts.ignoreSelf && messageJSON.source === this.opts.messageBusId) {
              return;
            }
            await handler.func(messageJSON.payload);
          } catch (error) {
            this.emit('handler-error', {
              source: messageJSON.source,
              subscriptionId: handler.subscriptionId,
              topic,
              partition,
              message,
              error,
            });
          }
        }
      },
    });
  }
  async stop() {
    this.#stopped = true;
    await this.#producer.disconnect();
    await this.#consumer.disconnect();
  }
  async publish(topic, payload, opts) {
    if (this.#stopped) {
      return;
    }
    await this.#producer.send({
      topic,
      messages: [{ value: JSON.stringify({ source: this.opts.messageBusId, payload, opts }) }],
    });
  }
  async subscribe(topic, opts, func) {
    if (typeof opts === 'function') {
      func = opts;
      opts = {};
    }
    if (this.#stopped) {
      return;
    }
    const subscriptionId = commons.uuid.v4();
    if (!this.#handlers[topic]) {
      this.#handlers[topic] = [];
    }
    this.#handlers[topic].push({ opts, func, subscriptionId });
    await this.publish(topic, { topic, source: this.opts.messageBusId }, { ignore: true });
    await this.#consumer.subscribe({ topic });
  }
  parseMessage(topic, message) {
    try {
      return JSON.parse(message.value.toString());
    } catch (error) {
      this.emit('bad-message-format', { topic, message, error });
      return null;
    }
  }
  static #defaults(opts) {
    const defaulted = opts ? commons.clone(opts) : {};
    defaulted.messageBusId = defaulted.messageBusId || commons.uuid.v4();
    defaulted.consumerGroupId = defaulted.consumerGroupId || defaulted.messageBusId;
    defaulted.kafka = defaulted.kafka || {
      clientId: commons.uuid.v4(),
      brokers: ['localhost:9092'],
    };
    return defaulted;
  }
};
