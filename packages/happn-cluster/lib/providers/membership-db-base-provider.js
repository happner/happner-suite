module.exports = class MembershipDbBaseProvider {
  // eslint-disable-next-line no-unused-vars
  async get(path, options) {
    throw new Error('get not implemented');
  }
  // eslint-disable-next-line no-unused-vars
  async upsert(path, memberEntry) {
    throw new Error('upsert not implemented');
  }
};
