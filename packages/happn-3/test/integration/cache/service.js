describe(
  require('../../__fixtures/utils/test_helper').create().testName(__filename, 3),
  function () {
    this.timeout(20000);
    var expect = require('expect.js');
    var service = require('../../../lib/services/cache/service');
    var serviceInstance = new service();
    var testId = require('shortid').generate();
    var config = {};
    var async = require('async');

    before('should initialize the service', function (callback) {
      var UtilService = require('../../../lib/services/utils/service');
      var utilService = new UtilService();

      serviceInstance.happn = {
        services: {
          utils: utilService,
        },
      };

      serviceInstance.initialize(config, callback);
    });

    after(function (done) {
      serviceInstance.stop(done);
    });
  }
);
