const test = require('../../__fixtures/utils/test_helper').create();

describe(test.testName(__filename, 3), function () {
  if (process.env.RUNNING_IN_ACTIONS) return; //skip all tests in github actions CI

  let clientFolder = test.homedir() + test.path.sep + '.happner' + test.path.sep;

  it('builds the happn browser client, returns the filepath', async () => {
    const clientCode = await test.happn.packager.browserClient();
    test
      .expect(clientCode)
      .to.be(clientFolder + 'happn-3-browser-client-' + test.happn.version + '.js');
  });

  it('builds the happn browser client, returns the contents', async () => {
    var clientCode = await test.happn.packager.browserClient({
      contentsOnly: true,
    });

    test
      .expect(
        clientCode.length >
          (clientFolder + 'happn-3-browser-client-' + test.happn.version + '.js').length
      )
      .to.be(true);
  });

  it('builds the happn browser client, in production mode - ensures we are using the cached file contents', async () => {
    process.env.NODE_ENV = 'production';

    test.happn.packager.__cachedBrowserClient = null;

    try {
      test.fs.unlinkSync(clientFolder + 'happn-3-browser-client-' + test.happn.version + '.js');
    } catch (e) {
      // ignore
    }

    var clientCode = await test.happn.packager.browserClient({
      contentsOnly: true,
      id: 'TEST_UNIQUE_ID',
    });

    test.expect(clientCode.indexOf('id TEST_UNIQUE_ID') > -1).to.be(true);

    var clientCodeAgain = await test.happn.packager.browserClient({
      contentsOnly: true,
    });

    test.expect(clientCodeAgain.indexOf('id TEST_UNIQUE_ID') > -1).to.be(true);
    process.env.NODE_ENV = 'test';
  });

  it('tests the client middleware is able to fetch the contents', function (done) {
    var Middleware = require('../../../lib/services/connect/middleware/client');
    var middleware = new Middleware();
    var req = {
      url: '/browser_client',
    };

    var res = {
      setHeader: function () {},
      end: function (content) {
        test
          .expect(
            content.length >
              (clientFolder + 'happn-3-browser-client-' + test.happn.version + '.js').length
          )
          .to.be(true);
        done();
      },
    };

    middleware.process(req, res);
  });

  it('tests the client middleware is able to fetch the cached contents', async () => {
    process.env.NODE_ENV = 'production';

    test.happn.packager.__cachedBrowserClient = null;

    try {
      test.fs.unlinkSync(clientFolder + 'happn-3-browser-client-' + test.happn.version + '.js');
    } catch (e) {
      // ignore
    }

    var clientCode = await test.happn.packager.browserClient({
      contentsOnly: true,
      id: 'TEST_UNIQUE_ID',
    });

    test.expect(clientCode.indexOf('id TEST_UNIQUE_ID') > -1).to.be(true);

    var Middleware = require('../../../lib/services/connect/middleware/client');
    var middleware = new Middleware();

    await new Promise((resolve, reject) => {
      var req = {
        url: '/browser_client',
      };
      var res = {
        setHeader: function () {},
        end: function (content) {
          try {
            test
              .expect(
                content.length >
                  (clientFolder + 'happn-3-browser-client-' + test.happn.version + '.js').length
              )
              .to.be(true);
            test.expect(content.indexOf('id TEST_UNIQUE_ID') > -1).to.be(true);
          } catch (e) {
            reject(e);
          }
          process.env.NODE_ENV = 'test';
          resolve();
        },
      };
      middleware.process(req, res);
    });
  });

  it('tests the minify option', async () => {
    process.env.NODE_ENV = 'production';

    test.happn.packager.__cachedBrowserClient = null;

    try {
      test.fs.unlinkSync(clientFolder + 'happn-3-browser-client-' + test.happn.version + '.js');
    } catch (e) {
      // ignore
    }

    var clientCode = await test.happn.packager.browserClient({
      contentsOnly: true,
      id: 'TEST_UNIQUE_ID',
    });

    test.expect(clientCode.indexOf('id TEST_UNIQUE_ID') > -1).to.be(true);

    var clientCodeAgain = await test.happn.packager.browserClient({
      contentsOnly: true,
    });

    test.expect(clientCodeAgain.indexOf('id TEST_UNIQUE_ID') > -1).to.be(true);

    process.env.NODE_ENV = 'test';

    test.happn.packager.__cachedBrowserClient = null;

    try {
      test.fs.unlinkSync(clientFolder + 'happn-3-browser-client-' + test.happn.version + '.js');
    } catch (e) {
      // ignore
    }

    clientCode = await test.happn.packager.browserClient({
      contentsOnly: true,
      min: true,
    });

    test.expect(clientCodeAgain.length > clientCode.length).to.be(true);
  });

  it('tests the client middleware is able to fetch the minified contents', async () => {
    test.happn.packager.__cachedBrowserClient = null;

    try {
      test.fs.unlinkSync(clientFolder + 'happn-3-browser-client-' + test.happn.version + '.js');
    } catch (e) {
      // ignore
    }

    process.env.NODE_ENV = 'test';

    var clientCode = await test.happn.packager.browserClient({
      contentsOnly: true,
      overwrite: true,
    });

    process.env.NODE_ENV = 'production';

    test.happn.packager.__cachedBrowserClient = null;

    try {
      test.fs.unlinkSync(clientFolder + 'happn-3-browser-client-' + test.happn.version + '.js');
    } catch (e) {
      // ignore
    }

    var Middleware = require('../../../lib/services/connect/middleware/client');
    var middleware = new Middleware();

    await new Promise((resolve, reject) => {
      middleware.process(
        {
          url: '/browser_client',
        },
        {
          setHeader: function () {},
          end: function (content) {
            try {
              test.expect(clientCode.length > content.length).to.be(true);
              process.env.NODE_ENV = 'test';
              resolve();
            } catch (e) {
              reject(e);
            }
          },
        }
      );
    });
  });
});
