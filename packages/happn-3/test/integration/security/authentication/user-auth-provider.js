require('../../../__fixtures/utils/test_helper').describe({ timeout: 30e3 }, (test) => {
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

  it('disallows the user from choosing an auth provider', async () => {
    let errorMessage;
    try {
      await connectAndVerifyAuthProvider('BAD_USER', 'password', 'test', 'test');
    } catch (e) {
      errorMessage = e.toString();
    }
    test
      .expect(errorMessage)
      .to.be('AccessDenied: security policy disallows choosing of own auth provider');
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
