require('../../__fixtures/utils/test_helper').describe({ timeout: 20000 }, (test) => {
  it('is able to create a self signed cert', function () {
    const util = require('../../../lib/services/utils/self-signed-cert-util').create();
    const certificate = util.createCertificate('happner-framework.com');
    test.expect(certificate.cert).to.not.be(null);
    test.expect(certificate.key).to.not.be(null);
  });
});
