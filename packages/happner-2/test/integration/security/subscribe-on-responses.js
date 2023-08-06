require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  test.createServersBefore([
    {
      secure: true,
      happn: {
        name: 'test-instance',
        services: {
          security: {
            config: {
              allowAnonymousAccess: true,
            },
          },
        },
      },
    },
  ]);
  test.createHappnerUserBefore('test', 'test');
  test.createHappnerSessionBefore('test', 'test');
  it('ensures responses are not leaked', async () => {
    const anonymousSession = await test.createHappnerSession({ username: '_ANONYMOUS' });
    let eventHappened = false;
    await anonymousSession.data.on(
      '/_exchange/responses/test-instance/security/changePassword/*/*',
      (data) => {
        test.log('response leaked: ', data);
        eventHappened = true;
      }
    );
    await test.sessions[0].exchange.security.changePassword('test', 'test1');
    if (eventHappened) {
      throw new Error('test failed');
    }
  });
  test.destroySessionsAfter();
  test.destroyServersAfter();
});
