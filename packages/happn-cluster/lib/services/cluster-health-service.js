const MemberStatuses = require('../constants/member-statuses');
const commons = require('happn-commons');
module.exports = class ClusterHealthService extends require('events').EventEmitter {
  #active = false;
  #healthReportIntervalMs;
  #registryService;
  #log;
  #deploymentId;
  #clusterName;
  #dependencies;
  #memberName;
  constructor(config, logger, registryService) {
    super();
    this.#log = logger;
    this.#registryService = registryService;
    this.#healthReportIntervalMs =
      config?.services?.membership?.config?.healthReportIntervalMs || 5e3;
  }

  static create(config, logger, registryService) {
    return new ClusterHealthService(config, logger, registryService);
  }

  stopHealthReporting() {
    this.#log.info(`stopping health reporting`);
    this.#active = false;
  }

  async startHealthReporting(deploymentId, clusterName, dependencies, memberName) {
    this.#deploymentId = deploymentId;
    this.#clusterName = clusterName;
    this.#dependencies = dependencies;
    this.#active = true;
    this.#memberName = memberName;
    while (this.#active) {
      try {
        const scanResult = await this.#registryService.scan(
          this.#deploymentId,
          this.#clusterName,
          this.#dependencies,
          this.#memberName,
          [MemberStatuses.STABLE]
        );
        if (scanResult === true) {
          this.#log.info('healthy');
        } else {
          // TODO: go into more detail
          this.#log.warn('unhealthy');
        }
      } catch (e) {
        this.#log.error(`failed health report: ${e.message}`);
      }
      await commons.delay(this.#healthReportIntervalMs);
    }
  }
};
