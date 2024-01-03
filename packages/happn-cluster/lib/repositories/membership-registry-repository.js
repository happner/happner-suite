module.exports = class MembershipRegistryRepository extends require('./base-repository') {
  constructor(databaseClient) {
    super(databaseClient);
  }

  static create(databaseClient) {
    return new MembershipRegistryRepository(databaseClient);
  }

  async set(memberPath, memberEntry) {
    const response = await this.databaseClient.upsert(
      `/_SYSTEM/DEPLOYMENT/${memberPath}`,
      memberEntry
    );
    return response;
  }

  async get(deploymentId, clusterName, staleMemberThreshold) {
    const results = await this.databaseClient.get(
      `/_SYSTEM/DEPLOYMENT/${deploymentId}/${clusterName}/*`,
      {
        criteria: {
          'data.timestamp': {
            $gte: Date.now() - staleMemberThreshold,
          },
        },
      }
    );
    return results.map((item) => item.data);
  }
};
