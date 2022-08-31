require('../../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const SystemService = require('../../../../lib/services/system/service');
  it('can getDescription', async () => {
    const systemService = new SystemService({ logger: test.mockLogger });
    systemService.name = 'test';
    systemService.happn = { config: { secure: true } };
    test.expect(systemService.getDescription()).to.eql({ name: 'test', secure: true });
    systemService.happn = { config: { secure: false } };
    test.expect(systemService.getDescription()).to.eql({ name: 'test', secure: false });
    test
      .expect(systemService.getDescription({ session: { cookieName: 'testCookieName' } }))
      .to.eql({ name: 'test', secure: false, cookieName: 'testCookieName' });
  });
});
