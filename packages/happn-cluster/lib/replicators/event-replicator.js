const Constants = require('../constants/all-constants');
module.exports = class EventReplicator extends require('events').EventEmitter {
  #config;
  #log;
  #happnService;
  #stopped;
  #processManager;
  constructor(config, logger, happnService, processManager) {
    super();
    this.#config = config;
    this.#config.securityChangeSetReplicateInterval =
      config?.services?.membership?.config?.securityChangeSetReplicateInterval || 3e3;
    this.#log = logger;
    this.#happnService = happnService;
    this.#processManager = processManager;
    this.#happnService.on(Constants.EVENT_KEYS.HAPPN_SERVICE_STARTED, () => {
      this.#start();
    });
    this.#happnService.on(Constants.EVENT_KEYS.HAPPN_SERVICE_STOPPED, () => {
      this.#stop();
    });
  }

  static create(config, logger, happnService, processManager) {
    return new EventReplicator(config, logger, happnService, processManager);
  }

  async #start() {
    this.#stopped = false;
    this.#log.info('started');
  }

  #stop() {
    this.#stopped = true;
    this.#log.info('stopped');
  }
};
