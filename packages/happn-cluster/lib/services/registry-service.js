module.exports = class RegistryService extends require('events').EventEmitter {
  #staleMemberThreshold;
  #log;
  #membershipRegistryRepository;
  constructor(config, membershipRegistryRepository, logger) {
    super();
    this.#staleMemberThreshold = config.staleMemberThreshold || 5e3;
    this.#log = logger;
    this.#membershipRegistryRepository = membershipRegistryRepository;
  }

  static create(config, membershipRegistryRepository, logger) {
    return new RegistryService(config, membershipRegistryRepository, logger);
  }

  async list(deploymentId, clusterName, excludeMemberName, statuses) {
    let items = await this.#membershipRegistryRepository.get(
      deploymentId,
      clusterName,
      this.#staleMemberThreshold
    );
    if (excludeMemberName) {
      // exclude the member
      items = items.filter((item) => !item.path.includes(`/${excludeMemberName}`));
    }
    if (statuses) {
      items = items.filter((item) => statuses.includes(item.status));
    }
    return items.map((item) => {
      const itemPathProperties = item.path.split('/');
      return {
        ...item,
        deploymentId,
        clusterName,
        serviceName: itemPathProperties[2],
        memberName: itemPathProperties[3],
      };
    });
  }

  async pulse(deploymentId, clusterName, serviceName, memberName, memberHost, status) {
    const path = `${deploymentId}/${clusterName}/${serviceName}/${memberName}`;
    this.#log.info(`pulse: ${path}: ${status}`);
    await this.#membershipRegistryRepository.set(path, {
      path,
      memberHost,
      timestamp: Date.now(),
      status,
    });
  }

  async scan(deploymentId, clusterName, dependencies, memberName, statuses) {
    const currentMembers = await this.list(deploymentId, clusterName, memberName, statuses);
    return Object.keys(dependencies).every((serviceName) => {
      let expectedCount = dependencies[serviceName];
      let foundCount = currentMembers.filter((item) => {
        return item.path.indexOf(`${deploymentId}/${clusterName}/${serviceName}/`) === 0;
      }).length;
      return foundCount >= expectedCount;
    });
  }
};
