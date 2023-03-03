require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, function (test) {
  it('disallows logouts for ttl 0 by configuration', async () => {
    const happn = require('happn-3');
    const happnInstance = await happn.service.create({
      secure: true,
      services: {
        security: {
          config: {
            allowTTL0Revocations: false, // the service will throw and bubble up an error if the client attempts to revoke an infinite ttl token
            profiles: [
              //profiles are in an array, in descending order of priority, so if you fit more than one profile, the top profile is chosen
              {
                name: 'infinite-token', // our intentionally long lived profile (assuming this user exists)
                session: {
                  'user.username': 'LONG_LIVED_USER',
                },
                policy: {
                  ttl: Infinity,
                },
              },
            ],
          },
        },
      },
    });

    const credentials = { username: 'LONG_LIVED_USER', password: 'xxx' };
    await happnInstance.services.security.users.upsertUser(credentials);
    const myClient = await happn.client.create(credentials);

    try {
      // will throw an error, as the server does not allow ttl 0 tokens to be revoked:
      await myClient.logout();
      throw new Error('Unexpected success');
    } catch (e) {
      test.chai
        .expect(e.message)
        .to.equal('revoking a token without a ttl means it stays in the revocation list forever');
      await happnInstance.stop();
    }
  });
});
