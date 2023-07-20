const commons = require('happn-commons');
module.exports = class ReplicationSubscriptionCache {
  #replicationPaths = {};
  #indexer;
  #deploymentId;
  #domain;
  constructor(deploymentId, domain) {
    this.#indexer = require('tame-search').create();
    this.#deploymentId = deploymentId;
    this.#domain = domain;
  }
  static create(deploymentId, domain) {
    return new ReplicationSubscriptionCache(deploymentId, domain);
  }
  get replicationPaths() {
    return commons.clone(this.#replicationPaths);
  }
  addReplicationPaths(subscriberKey, replicationPaths) {
    const pathsClone = commons.clone(replicationPaths).sort();
    const hash = commons.hashString(JSON.stringify(pathsClone));
    if (this.#replicationPaths[`${hash}-${subscriberKey}`]) {
      return;
    }
    this.#replicationPaths[`${hash}-${subscriberKey}`] = pathsClone;
    pathsClone.forEach((path) => {
      this.#indexer.subscribe(subscriberKey, path, { hash });
    });
  }
  removeReplicationPaths(subscriberKey) {
    return this.#indexer.unsubscribeAll(subscriberKey);
  }
  lookupTopics(path) {
    return this.#indexer
      .search(path)
      .map((result) => `${this.#deploymentId}-${this.#domain}-${result.hash}`);
  }
};
