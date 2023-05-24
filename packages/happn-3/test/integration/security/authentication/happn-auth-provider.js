const happn = require('../../../../lib');
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

  it('Tests we can change the password of the session', async () => {
    let testError;
    let instance = await test.createInstance({ secure: true });
    let testUser = {
      username: 'passwordTest',
      password: 'abc',
      custom_data: {
        something: 'usefull',
      },
    };
    await instance.services.security.users.upsertUser(testUser);

    try {
      await instance.services.security.resetPassword('passwordTest');
    } catch (e) {
      testError = e;
    }
    test.expect(testError).to.eql({
      code: 500,
      message: 'providerResetPassword not implemented.',
      name: 'SystemError',
      severity: 0,
    });

    let client = await happn.client.create({
      port: 55000,
      ...testUser,
    });
    await client.changePassword({ oldPassword: 'abc', newPassword: 'newPassword' });
    await client.disconnect();
    try {
      await happn.client.create({
        port: 55000,
        ...testUser,
      });
    } catch (e) {
      testError = e;
    }
    test
      .expect(testError)
      .to.eql({ name: 'AccessDenied', code: 401, message: 'Invalid credentials' });

    client = await happn.client.create({
      port: 55000,
      username: 'passwordTest',
      password: 'newPassword',
    });
    try {
      await client.changePassword({ oldPassword: 'abc', newPassword: 'newPassword' });
    } catch (e) {
      testError = e;
    }
    test
      .expect(testError)
      .to.eql({ name: 'SystemError', message: 'Invalid old password', code: 500, severity: 0 });

    try {
      await client.changePassword({ newPassword: 'Partial Data' });
    } catch (e) {
      testError = e;
    }
    test.expect(testError).to.eql({
      name: 'SystemError',
      message: 'Invalid parameters: oldPassword and newPassword required',
      code: 500,
      severity: 0,
    });

    await client.disconnect();
    await test.destroyAllInstances();
  });

  it('Tests happn security with insecure config', async () => {
    let testError;
    let instance = await test.createInstance({ secure: false });
    let testUser = {
      username: 'passwordTest',
      password: 'abc',
      custom_data: {
        something: 'usefull',
      },
    };
    await instance.services.security.users.upsertUser(testUser);

    let client = await happn.client.create({
      port: 55000,
      ...testUser,
    });

    try {
      await client.changePassword({ oldPassword: 'abc', newPassword: 'newPassword' });
    } catch (e) {
      testError = e;
    }
    test.expect(testError.message).to.be('Cannot change-password Not Secure');

    try {
      await client.revokeToken();
    } catch (e) {
      testError = e;
    }
    test.expect(testError.message).to.be('Cannot revoke-token Not Secure');

    await client.disconnect();
    await test.destroyAllInstances();
  });
});
