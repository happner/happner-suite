require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  test.createServersBefore(serverConfig());

  test.createHappnerUserBefore('testUser', 'xxx', {
    methods: {
      'test/testMethod': { authorized: true },
    },
  });

  test.createHappnerSessionBefore('testUser', 'xxx');

  it('fetches api/client with authDelegation: true and a cookie included', async () => {
    const result = await test.httpGet(`http://127.0.0.1:55000/api/client`, {
      headers: { Cookie: `happn_token=${test.sessions[0].token}` },
    });
    test.expect(result.indexOf('DOCTYPE html')).to.be(-1);
  });

  test.destroySessionsAfter();
  test.destroyServersAfter();

  function serverConfig() {
    return {
      secure: true,
      authorityDelegationOn: true,
      modules: {
        test: {
          instance: {
            testMethod: async () => {},
          },
        },
      },
      components: {
        test: {},
      },
    };
  }
});
