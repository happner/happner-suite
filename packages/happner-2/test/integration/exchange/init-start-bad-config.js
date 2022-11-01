require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  it('breaks trying to init a mesh with sync methods configured with callbacks', async () => {
    const config = getConfig({
      exclusive: false,
      methods: {
        init: {
          type: 'sync',
          parameters: [
            {
              name: 'options',
              type: 'options',
              require: true,
              value: {},
            },
            {
              name: 'callback',
              type: 'callback',
              require: true,
            },
          ],
        },
        start: {
          type: 'async',
        },
      },
    });
    let errorMessage;
    try {
      await test.Mesh.create(config);
    } catch (e) {
      errorMessage = e.message;
    }
    test
      .expect(errorMessage)
      .to.be('method component.init has been configured as a sync with a callback');
  });

  it('breaks trying to start a mesh with sync methods configured with callbacks', async () => {
    const config = getConfig({
      exclusive: false,
      methods: {
        start: {
          type: 'sync',
          parameters: [
            {
              name: 'options',
              type: 'options',
              require: true,
            },
            {
              name: 'callback',
              type: 'callback',
              require: true,
            },
          ],
        },
        init: {
          type: 'async',
          parameters: [
            {
              name: 'options',
              type: 'options',
              require: true,
              value: {},
            },
          ],
        },
      },
    });
    let errorMessage;
    try {
      await test.Mesh.create(config);
    } catch (e) {
      errorMessage = e.message;
    }
    test
      .expect(errorMessage)
      .to.be('method component.start has been configured as a sync with a callback');
  });

  function getConfig(schema) {
    return {
      happn: {
        setOptions: {
          timeout: 1000,
        },
      },
      util: {
        //logLevel: 'trace'
      },
      modules: {
        component: {
          instance: {
            init: (opts, cb) => {
              if (cb) return cb(null, opts);
              return opts;
            },
            start: (opts, cb) => {
              if (cb) return cb(null, opts);
              return opts;
            },
          },
        },
      },
      components: {
        component: {
          initMethod: 'init',
          startMethod: 'start',
          schema,
        },
      },
    };
  }
});
