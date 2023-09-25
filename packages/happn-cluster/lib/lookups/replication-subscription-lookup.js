const commons = require('happn-commons');
module.exports = class ReplicationSubscriptionCache {
  #replicationPaths = {};
  #indexer;
  #deploymentId;
  #clusterName;
  #memberName;

  constructor(deploymentId, clusterName, memberName) {
    this.#indexer = require('tame-search').create();
    this.#deploymentId = deploymentId;
    this.#clusterName = clusterName;
    this.#memberName = memberName;
  }

  static create(deploymentId, clusterName, memberName) {
    return new ReplicationSubscriptionCache(deploymentId, clusterName, memberName);
  }

  get replicationPaths() {
    return commons.clone(this.#replicationPaths);
  }

  getReplicationPathsHash(replicationPaths) {
    const pathsClone = commons.clone(replicationPaths);
    pathsClone.sort();
    return commons.hashString(JSON.stringify(pathsClone));
  }

  addReplicationPaths(memberName, replicationPaths) {
    if (memberName === this.#memberName) {
      // ignore self
      return;
    }
    const hash = this.getReplicationPathsHash(replicationPaths);
    if (this.#replicationPaths[`${hash}-${memberName}`]) {
      return;
    }
    this.#replicationPaths[`${hash}-${memberName}`] = replicationPaths;
    replicationPaths.forEach((path) => {
      this.#indexer.subscribe(memberName, path, { hash });
    });
  }

  removeReplicationPaths(subscriberKey) {
    return this.#indexer.unsubscribeAll(subscriberKey);
  }

  lookupTopics(path) {
    const lookedUp = [
      ...new Set( // this deduplicates the items
        this.#indexer
          .search(path)
          .map(
            (result) =>
              `${this.#deploymentId}-${this.#clusterName}-${result.hash}-${result.subscriberKey}`
          )
      ),
    ];
    return lookedUp;
  }
};
