require('../../../__fixtures/utils/test_helper').describe({ timeout: 30e3 }, (test) => {
  const path = require('path');
  it('Tests that with blank config, we get a standard (happn-3) auth provider', async () => {
    let instance = await test.createInstance();
    test.expect(Object.keys(instance.services.security.authProviders)).to.eql(['happn', 'default']);
    await test.destroyAllInstances();
  });

  it('Tests that with blank config, the default auth provider IS the happn-3 provider', async () => {
    let instance = await test.createInstance();
    test
      .expect(instance.services.security.authProviders.default)
      .to.be(instance.services.security.authProviders.happn);
    await test.destroyAllInstances();
  });

  it('Tests adding auth provider (no default), in config, the default auth provider should be the happn-3 provider', async () => {
    let instance = await test.createInstance({
      services: {
        security: {
          config: {
            authProviders: {
              blankAuth: path.resolve(
                __dirname,
                '../../../__fixtures/test/integration/security/authentication/secondAuthProvider.js'
              ),
            },
          },
        },
      },
    });
    test
      .expect(Object.keys(instance.services.security.authProviders))
      .to.eql(['happn', 'blankAuth', 'default']);
    test
      .expect(instance.services.security.authProviders.default)
      .to.be(instance.services.security.authProviders.happn);
    await test.destroyAllInstances();
  });

  it('Tests adding an incorrectly configured auth provider we should get a base auth provider which returns an error on login with creds', async () => {
    let eMessage;
    try {
      await test.createInstance({
        services: {
          security: {
            config: {
              authProviders: { bad: 'bad-provider' },
              defaultAuthProvider: 'happn',
            },
          },
        },
      });
    } catch (e) {
      eMessage = e.message;
    }
    test.expect(eMessage).to.include.string('Cannot find module');
    await test.destroyAllInstances();
  });
});
