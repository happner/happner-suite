const ClusterPeerBuilder = require('../builders/cluster-peer-builder');
module.exports = class RegistryService extends require('events').EventEmitter {
  #staleMemberThreshold;
  #log;
  #membershipRegistryRepository;
  #lastMembersList = [];
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
      return ClusterPeerBuilder.create()
        .withDeploymentId(deploymentId)
        .withClusterName(clusterName)
        .withServiceName(itemPathProperties[2])
        .withMemberName(itemPathProperties[3])
        .withMemberHost(item.memberHost)
        .withMemberPort(item.memberPort)
        .withMemberStatus(item.status)
        .withTimestamp(item.timestamp)
        .withMembershipPath(item.path)
        .build();
    });
  }

  async pulse({
    deploymentId,
    clusterName,
    serviceName,
    memberName,
    memberHost,
    memberPort,
    memberStatus,
    timestamp,
  }) {
    const path = `${deploymentId}/${clusterName}/${serviceName}/${memberName}`;
    this.#log.debug(`pulse: ${path}: ${memberStatus}`);
    await this.#membershipRegistryRepository.set(path, {
      path,
      memberHost,
      memberPort,
      status: memberStatus,
      timestamp,
    });
  }

  async scan(deploymentId, clusterName, dependencies, memberName, statuses) {
    const currentMembers = await this.list(deploymentId, clusterName, memberName, statuses);
    const dependenciesFulfilled = Object.keys(dependencies).every((serviceName) => {
      let expectedCount = dependencies[serviceName];
      let foundCount = currentMembers.filter((item) => {
        return item.membershipPath.indexOf(`${deploymentId}/${clusterName}/${serviceName}/`) === 0;
      }).length;
      return foundCount >= expectedCount;
    });
    let newMembers = [];
    let missingSinceLastMembers = [];
    if (this.#lastMembersList.length === 0) {
      newMembers = this.#lastMembersList.slice();
    } else {
      newMembers = currentMembers.filter((currentMemberInfo) => {
        return !this.#lastMembersList.find(
          (lastMemberInfo) => lastMemberInfo.memberName === currentMemberInfo.memberName
        );
      });
      missingSinceLastMembers = this.#lastMembersList.filter((lastMemberInfo) => {
        return !currentMembers.find(
          (currentMemberInfo) => currentMemberInfo.memberName === lastMemberInfo.memberName
        );
      });
    }
    this.#lastMembersList = currentMembers;
    return {
      dependenciesFulfilled,
      currentMembers,
      newMembers,
      missingSinceLastMembers,
    };
  }
};
