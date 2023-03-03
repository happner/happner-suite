/* eslint-disable no-console */
let start = async () => {
  // by default the system will allow revocation of infinite ttl tokens
  // to configure the security service to disallow, set the property allowTTL0Revocations to false for the security service config:

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
    console.log('UNEXPECTED SUCCESS');
  } catch (e) {
    // e.message should be 'revoking a token without a ttl means it stays in the revocation list forever'
    console.log(`EXPECTED FAILURE: ${e.message}`);
    await happnInstance.stop();
  }
};
start();
