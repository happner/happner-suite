const expect = require('expect.js');
const Happn = require('../../../');

describe(
  require('../../__fixtures/utils/test_helper')
    .create()
    .testName(__filename, 3),
  function() {
    this.timeout(4000);

    it('fails to login to non existing server', function(done) {
      Promise.resolve()

        .then(function() {
          return Happn.client.create({ port: 55555 });
        })

        .catch(function(e) {
          expect(e.stack).to.not.be(null);
          expect(e.stack).to.not.be(undefined);
          expect(e.message).to.be('connect ECONNREFUSED 127.0.0.1:55555');
          expect(e.toString()).to.contain('ECONNREFUSED');
          done();
        });
    });
  }
);
