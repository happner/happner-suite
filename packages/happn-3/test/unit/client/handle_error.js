describe(
  require('../../__fixtures/utils/test_helper').create().testName(__filename, 3),
  function () {
    this.timeout(5000);

    var expect = require('expect.js');
    var HappnClient = require('../../../lib/client');
    const Constants = require('happn-commons').constants;

    it('tests the handle_error function, non fatal error', function (done) {
      var happnClient = new HappnClient();

      happnClient.__initializeEvents();
      happnClient.__initializeState();
      happnClient.log = {
        error: function () {},
      };

      happnClient.onEvent('error', function (error) {
        expect(happnClient.state !== Constants.CLIENT_STATE.ERROR).to.be(true);
        expect(error.message).to.be('test error');
        done();
      });

      happnClient.handle_error(new Error('test error'));
    });

    it('tests the handle_error function only stores the last 100 errors', function (done) {
      var happnClient = new HappnClient();

      happnClient.__initializeEvents();
      happnClient.__initializeState();
      happnClient.log = {
        error: function () {},
      };

      for (var i = 0; i <= 110; i++) happnClient.handle_error(new Error('test error: ' + i), true);

      expect(happnClient.state.errors.length).to.be(100);
      expect(happnClient.state.errors[99].error.message).to.be('test error: 110');

      done();
    });
  }
);
