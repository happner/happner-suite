require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  test.createServersBefore([
    {
      secure: true,
    },
  ]);
  test.createHappnerUserBefore('test', 'test');
  test.createHappnerSessionBefore('test', 'test');
  it('is able to login with a token and reset the users password', async () => {
    const token = test.sessions[0].data.session.token;
    const tokenSession = await test.createHappnerSession({ token });
    await tokenSession.exchange.security.changePassword('test', 'new');
  });
  test.destroySessionsAfter();
  test.destroyServersAfter();
});
