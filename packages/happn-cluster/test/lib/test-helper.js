const BaseTestHelper = require('happn-commons-test');
const Happn = require('happn-3');
class TestHelper extends BaseTestHelper {
  constructor() {
    super();
    this.package = require('../../package.json');
  }

  static create() {
    return new TestHelper();
  }

  /**
   *
   * @param {*} options
   * @param {(test: TestHelper)=>void} handler
   * @returns
   */
  static describe(options, handler) {
    return BaseTestHelper.extend(TestHelper).describe(options, handler);
  }

  async createUserOnContainer(container, username, password, permissions) {
    return await container.dependencies.happnService.securityService.users.upsertUser({
      username,
      password,
      permissions,
    });
  }

  async createSession(port, username, password) {
    return await Happn.client.create({ port, username, password });
  }

  async destroySessions(...sessions) {
    for (let session of sessions) {
      await session.disconnect();
    }
  }

  async updateUserPermissionsOnContainer(container, username, permissions, delay) {
    await container.dependencies.happnService.securityService.users.upsertPermissions({
      username,
      permissions,
    });
    await this.delay(delay || 1e3);
  }
}

module.exports = TestHelper;
