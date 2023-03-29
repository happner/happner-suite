module.exports = class ProcessManagerService {
  #log;
  #process;
  constructor(logger, nodeProcess) {
    this.#log = logger;
    this.#process = nodeProcess;
  }
  static create(logger) {
    return new ProcessManagerService(logger);
  }
  fatal(message) {
    this.#log.error(`FATAL: ${message}`);
    this.#process.exit(1);
  }
};
