const HealthStatuses = require('../constants/health-statuses');
module.exports = class ClusterHealthService extends require('events').EventEmitter {
  #log;
  #lastDependenciesFulfilled;
  constructor(logger) {
    super();
    this.#log = logger;
  }

  static create(logger) {
    return new ClusterHealthService(logger);
  }

  reportHealth(memberScanResult) {
    let healthStatus = memberScanResult.dependenciesFulfilled
      ? HealthStatuses.HEALTHY
      : HealthStatuses.UNHEALTHY;
    if (
      this.#lastDependenciesFulfilled !== memberScanResult.dependenciesFulfilled &&
      healthStatus === HealthStatuses.HEALTHY
    ) {
      this.#log.info(`cluster member health status: ${healthStatus}`);
    }
    if (healthStatus !== HealthStatuses.HEALTHY) {
      // TODO: go into more detail
      this.#log.warn(`cluster member health status: ${healthStatus}`);
    }
    this.#lastDependenciesFulfilled = memberScanResult.dependenciesFulfilled;
  }
};
