const BaseBuilder = require('happn-commons').BaseBuilder;
module.exports = class ReplicatedMessageBuilder extends BaseBuilder {
  #reservedMeta = [
    'created',
    'modified',
    'path',
    'type',
    'status',
    'published',
    'eventId',
    'sessionId',
    'action',
    'channel',
    'sessionId',
    'consistency',
    'publicationId',
  ];
  constructor() {
    super();
  }
  static create() {
    return new ReplicatedMessageBuilder();
  }
  build() {
    const object = super.build(require('../objects/replicated-message-object').create());
    return object;
  }
  withDataAndMeta(data, meta) {
    const action = meta.action
      .substr(meta.action.indexOf('/') + 1, meta.action.indexOf('@') - 1)
      .toLowerCase();

    meta.action = action;
    delete meta.type;

    const eventId = meta.publicationId.split('-').pop();
    const message = {
      session: {
        id: meta.sessionId,
      },
      request: {
        action: action,
        path: meta.path,
        data: data,
        eventId: eventId,
        options: {
          noCluster: true, // don't emit back into cluster
          meta: {},
        },
      },
      response: { data, _meta: meta, action },
    };

    Object.keys(meta).forEach((key) => {
      if (this.#reservedMeta.indexOf(key) >= 0) return;
      message.request.options.meta = message.request.options.meta || {};
      message.request.options.meta[key] = meta[key];
    });

    return this.set('.', message, BaseBuilder.Types.OBJECT);
  }
};
