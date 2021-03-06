describe(
  require('../../__fixtures/utils/test_helper').create().testName(__filename, 3),
  function () {
    var happn = require('../../../lib/index');
    var expect = require('expect.js');
    var serviceInstance;

    var getService = function (config, callback) {
      happn.service.create(config, callback);
    };

    before('starts the service', function (done) {
      getService(
        {
          secure: true,
          services: {},
        },
        function (e, service) {
          if (e) return done(e);

          serviceInstance = service;

          done();
        }
      );
    });

    after('stop the test service', function (callback) {
      serviceInstance.stop(callback);
    });

    it('tests process message handler', function (done) {
      process.__oldSend = process.send;

      var sent = [];

      process.send = function (message) {
        sent.push(message);
      };

      try {
        serviceInstance.services.system.__processSystemMessage({ action: 'GC' });
        serviceInstance.services.system.__processSystemMessage({ action: 'MEMORY_USAGE' });
        serviceInstance.services.system.__processSystemMessage({ action: 'STATS' });

        expect(sent.length).to.be(3);

        done();
      } catch (e) {
        process.send = process.__oldSend;
        done(e);
      }
    });
  }
);
