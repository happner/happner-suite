module.exports = class ClusterPeerObject {
  #memberStatus;
  #timestamp;
  #membershipPath;
  #replicationPaths;
  static create() {
    return new ClusterPeerObject();
  }
  get memberStatus() {
    return this.#memberStatus;
  }
  set memberStatus(val) {
    this.#memberStatus = val;
  }
  get timestamp() {
    return this.#timestamp;
  }
  set timestamp(val) {
    this.#timestamp = val;
  }
  get membershipPath() {
    return this.#membershipPath;
  }
  set membershipPath(val) {
    this.membershipPath = val;
  }
  get replicationPaths() {
    return this.#replicationPaths;
  }
  set replicationPaths(val) {
    this.#replicationPaths = val;
  }
};
