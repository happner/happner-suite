require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  //ensure a previous test has not polluted the sessions and instances by not tearing down correctly
  test.expect(test.sessions.length).to.be(0);
  test.expect(test.instances.length).to.be(0);

  test.createInstanceBefore({
    secure: true,
    services: {
      security: {
        config: {
          httpsCookie: true,
        },
      },
    },
  });
  test.createAdminWSSessionBefore();
  // keep the order of these tests the same, or face irrevocable consequences...
  it('logs in and disconnects a client simultaneously', testSimultaneousLoginDisconnect);
  it(
    'tests returning null on getSession after successful login',
    testGetSessionAfterSuccessfulLogin
  );

  // tear down
  test.destroyAllSessionsAfter();
  test.destroyAllInstancesAfter();

  async function testGetSessionAfterSuccessfulLogin() {
    const instance = test.instances[0];
    instance.services.session.getSession = () => null;
    let errorMessage;
    try {
      await test.createAdminWSSession({
        loginRetry: 0,
      });
    } catch (e) {
      errorMessage = e.message;
    }
    test.expect(errorMessage).to.be('session disconnected during login');
  }

  function createRequestArray(adminSession) {
    return [adminSession.connect(), adminSession.disconnect()];
  }

  async function testSimultaneousLoginDisconnect() {
    const adminSession = test.sessions[0];
    const operations = [];

    for (let i = 0; i < 100; i++) {
      operations.push(...createRequestArray(adminSession));
    }

    await Promise.all(operations);
    // await test.delay(5e3);
  }
});
