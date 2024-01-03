module.exports = class ProcessManagerService {
  #log;
  #process;
  constructor(logger, nodeProcess) {
    this.#log = logger;
    this.#process = nodeProcess;
  }
  static create(logger, nodeProcess) {
    return new ProcessManagerService(logger, nodeProcess);
  }
  fatal(message) {
    this.#log.error(`FATAL: ${message}`);
    this.#process.exit(1);
  }
};
