const commons = require('happn-commons');
module.exports = class ReplicationSubscriptionCache {
  #replicationPaths = {};
  #indexer;
  #deploymentId;
  #clusterName;
  constructor(deploymentId, clusterName) {
    this.#indexer = require('tame-search').create();
    this.#deploymentId = deploymentId;
    this.#clusterName = clusterName;
  }
  static create(deploymentId, clusterName) {
    return new ReplicationSubscriptionCache(deploymentId, clusterName);
  }
  get replicationPaths() {
    return commons.clone(this.#replicationPaths);
  }
  getReplicationPathsHash(replicationPaths) {
    const pathsClone = commons.clone(replicationPaths);
    pathsClone.sort();
    return commons.hashString(JSON.stringify(pathsClone));
  }
  addReplicationPaths(subscriberKey, replicationPaths) {
    const hash = this.getReplicationPathsHash(replicationPaths);
    if (this.#replicationPaths[`${hash}-${subscriberKey}`]) {
      return;
    }
    this.#replicationPaths[`${hash}-${subscriberKey}`] = replicationPaths;
    replicationPaths.forEach((path) => {
      this.#indexer.subscribe(subscriberKey, path, { hash });
    });
  }
  removeReplicationPaths(subscriberKey) {
    return this.#indexer.unsubscribeAll(subscriberKey);
  }
  lookupTopics(path) {
    return [
      ...new Set( // this deduplicates the items
        this.#indexer
          .search(path)
          .map((result) => `${this.#deploymentId}-${this.#clusterName}-${result.hash}`)
      ),
    ];
  }
};
