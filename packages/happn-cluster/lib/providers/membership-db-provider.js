module.exports = class MembershipDbHappnProvider {
  #happnService;
  constructor(happnService) {
    this.#happnService = happnService;
  }
  static create(happnService) {
    return new MembershipDbHappnProvider(happnService);
  }
  // eslint-disable-next-line no-unused-vars
  get(path, options) {
    return new Promise((resolve, reject) => {
      this.#happnService.database.get(path, options, (e, result) => {
        if (e) return reject(e);
        resolve(result);
      });
    });
  }
  // eslint-disable-next-line no-unused-vars
  upsert(path, memberEntry) {
    return new Promise((resolve, reject) => {
      return this.#happnService.database.upsert(path, memberEntry, (e, result) => {
        if (e) return reject(e);
        resolve(result);
      });
    });
  }
};
