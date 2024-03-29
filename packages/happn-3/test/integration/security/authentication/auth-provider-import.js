describe(
  require('../../../__fixtures/utils/test_helper').create().testName(__filename, 3),
  function () {
    const happn = require('../../../../lib/index');
    const expect = require('expect.js');
    const path = require('path');
    async function getService(config) {
      return new Promise((res, rej) => {
        happn.service.create(config, (e, service) => {
          if (e) rej(e);
          res(service);
        });
      });
    }

    async function stopService(instance) {
      return new Promise((res, rej) => {
        instance.stop((e) => {
          if (e) rej(e);
          res();
        });
      });
    }

    function testLogin(instance, credentials, sessionId, request) {
      return new Promise((resolve) => {
        instance.services.security.login(credentials, sessionId, request, (e, result) => {
          if (e) return resolve(e.message);
          resolve(result);
        });
      });
    }

    it('Tests adding a non-happ3 auth provider (by path) in config, by config the default auth provider should be the added provider', async () => {
      let instance = await getService({
        services: {
          security: {
            config: {
              authProviders: {
                blankAuth: path.resolve(
                  __dirname,
                  '../../../__fixtures/test/integration/security/authentication/secondAuthProvider.js'
                ),
              },
              defaultAuthProvider: 'blankAuth',
            },
          },
        },
      });

      expect(Object.keys(instance.services.security.authProviders)).to.eql([
        'happn',
        'blankAuth',
        'default',
      ]);
      expect(instance.services.security.authProviders.default).to.be(
        instance.services.security.authProviders.blankAuth
      );

      expect(await testLogin(instance, { authType: 'unconfigured' }, undefined, {})).to.be(
        'Login called in second auth provider'
      );

      let errorMessage;
      try {
        instance.services.security.authProviders.default.accessDenied('Error Message');
      } catch (e) {
        errorMessage = e.message;
      }
      expect(errorMessage).to.be('Error Message');
      await stopService(instance);
    });

    it('Tests adding a non-happ3 auth provider (by path) in config, with happn = false', async () => {
      let instance = await getService({
        services: {
          security: {
            config: {
              authProviders: {
                blankAuth: path.resolve(
                  __dirname,
                  '../../../__fixtures/test/integration/security/authentication/secondAuthProvider.js'
                ),
                happn: false,
              },
              defaultAuthProvider: 'blankAuth',
            },
          },
        },
      });

      expect(Object.keys(instance.services.security.authProviders)).to.eql([
        'happn',
        'blankAuth',
        'default',
      ]);
      expect(instance.services.security.authProviders.default).to.be(
        instance.services.security.authProviders.blankAuth
      );
      expect(await testLogin(instance, { authType: 'unconfigured' }, undefined, {})).to.be(
        'Login called in second auth provider'
      );
      await stopService(instance);
    });
  }
);
