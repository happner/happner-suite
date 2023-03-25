module.exports = class BaseRepository {
  #databaseClient;
  constructor(databaseClient) {
    this.#databaseClient = databaseClient;
  }

  get databaseClient() {
    return this.#databaseClient;
  }
};
