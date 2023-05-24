require('../../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  test.createInstanceBefore({
    secure: true,
    services: {
      security: {
        config: {
          authProviders: {
            test: test.path.resolve(
              __dirname,
              '../../../__fixtures/test/integration/security/authentication/workingAuth.js'
            ),
          },
          defaultAuthProvider: 'happn',
          allowUserChooseAuthProvider: false,
        },
      },
    },
  });

  test.createUserBefore({
    username: 'secondTestuser@somewhere.com',
    password: 'secondPass',
    authType: 'test',
  });

  test.createUserBefore({
    username: 'BAD_USER',
  });

  it('is able to login using the test auth provider', async () => {
    await connectAndVerifyAuthProvider('secondTestuser@somewhere.com', 'secondPass', 'test');
    await connectAndVerifyAuthProvider('_ADMIN', 'happn', 'happn');
  });

  it('tests doing a login directed at the test auth provider, we also login with the token and ensure that works', async () => {
    const sessionInfo = await test.doRequest(
      '/auth/login?username=secondTestuser@somewhere.com&password=secondPass',
      null,
      true
    );
    const sessionInfo1 = await test.doRequest(
      `/auth/login?happn_token=${sessionInfo.data}`,
      null,
      true
    );
    test.expect(sessionInfo1.data.length).to.be.greaterThan(0);

    let errorMessage;
    try {
      await test.instances[0].services.security.resetPassword('BAD_USER');
    } catch (e) {
      errorMessage = e;
    }
    test.expect(errorMessage.message).to.eql('providerResetPassword not implemented.');

    try {
      await test.instances[0].services.security.resetPassword('secondTestuser@somewhere.com');
    } catch (e) {
      errorMessage = e;
    }
    test
      .expect(errorMessage.message)
      .to.eql('Works !! Password reset secondTestuser@somewhere.com');

    let testClient = await test.happn.client.create({
      username: 'secondTestuser@somewhere.com',
      password: 'secondPass',
    });
    try {
      await testClient.changePassword({
        oldPassword: 'happn',
        newPassword: 'newPassword',
      });
    } catch (e) {
      errorMessage = e;
    }
    test.expect(errorMessage).to.eql({
      name: 'SystemError',
      message: 'providerChangePassword not implemented.',
      code: 500,
      severity: 0,
    });
    await testClient.disconnect();
  });

  it('disallows the user from choosing an auth provider', async () => {
    let errorMessage;
    try {
      await connectAndVerifyAuthProvider('BAD_USER', 'password', 'test', 'test');
    } catch (e) {
      errorMessage = e.toString();
    }
    test
      .expect(errorMessage)
      .to.be(
        'AccessDenied: Invalid credentials: security policy disallows choosing of own auth provider'
      );
  });

  test.destroyAllInstancesAfter();

  async function connectAndVerifyAuthProvider(
    username,
    password,
    authProvider,
    chosenAuthProvider
  ) {
    const credentials = {
      username,
      password,
    };
    if (chosenAuthProvider) {
      credentials.authType = chosenAuthProvider;
    }
    let testClient = await test.happn.client.create(credentials);
    test.expect(testClient.session.authType).to.be(authProvider);
    await testClient.disconnect();
  }
});
