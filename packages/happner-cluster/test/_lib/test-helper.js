const BaseTestHelper = require('happn-commons-test');
module.exports = class TestHelper extends BaseTestHelper {
  constructor() {
    super();
    this.path = require('path');
    this.baseConfig = require('./base-config');
    this.HappnerCluster = require('../..');
    this.HappnerClient = require('happner-client');
    this.Happner = require('happner-2');
    this.stopCluster = require('./stop-cluster');
    this.clearMongoCollection = require('./clear-mongo-collection');
    this.getSeq = require('./helpers/getSeq');
    this.client = require('./client');
    this.lightClient = require('./client-light');

    this.users = require('./users');
    this.clusterStarter = require('./cluster-starter.js');
    this.hooks = require('./hooks.js');
    this.clients = [];
    this.servers = [];
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
};
