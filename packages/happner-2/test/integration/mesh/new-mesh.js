require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const Mesh = test.Mesh;
  let mesh;
  it('tests the client newMesh call', function (done) {
    Mesh.create(function (e, instance) {
      if (e) return done(e);
      mesh = instance;

      mesh._mesh._createElement(
        {
          component: {},
          module: {
            config: {},
          },
        },
        {},
        function () {
          mesh.stop(
            {
              reconnect: false,
            },
            done
          );
        }
      );
    });
  });

  it('tests the client newMesh call, _updateElement', function (done) {
    Mesh.create(function (e, instance) {
      if (e) return done(e);
      mesh = instance;

      var mockElement1 = {
        component: {
          name: 'testComponent',
          config: {},
        },
        module: {
          name: 'testComponent',
          config: {
            instance: {
              testMethod: function (callback) {
                callback(null, true);
              },
            },
          },
        },
      };

      var mockElement2 = {
        component: {
          name: 'testComponent',
          config: {},
        },
        module: {
          name: 'testComponent',
          config: {
            instance: {
              testMethod: function (callback) {
                callback(null, false);
              },
            },
          },
        },
      };

      mesh._mesh._createElement(mockElement1, {}, function (e) {
        if (e) return done(e);
        mesh.exchange.testComponent.testMethod(function (e, result) {
          test.expect(result).to.be(true);
          mesh._mesh._updateElement(mockElement2, function (e) {
            if (e) return done(e);
            mesh.exchange.testComponent.testMethod(function (e, result) {
              test.expect(result).to.be(false);
              mesh.stop(
                {
                  reconnect: false,
                },
                done
              );
            });
          });
        });
      });
    });
  });

  it('tests a re-initialized mesh', function (done) {
    Mesh.create(function (e, instance) {
      if (e) return done(e);
      mesh = instance;

      mesh._mesh._createElement(
        {
          component: {},
          module: {
            config: {},
          },
        },
        {},
        function () {
          mesh.stop(
            {
              reconnect: false,
            },
            function (e) {
              if (e) return done(e);

              mesh.initialize({}, function (e, instance) {
                instance._mesh._createElement(
                  {
                    component: {},
                    module: {
                      config: {},
                    },
                  },
                  {},
                  function () {
                    mesh.stop(
                      {
                        reconnect: false,
                      },
                      done
                    );
                  }
                );
              });
            }
          );
        }
      );
    });
  });

  it('tests that the waiting interval is configurable', async function () {
    this.timeout(8e3);
    let mesh = await new Mesh().initialize({
      waitingInterval: 2e3,
      components: { slowComponent: { startMethod: 'start' } },
      modules: {
        slowComponent: {
          instance: { start: (cb) => setTimeout(cb, 4000) },
        },
      },
    });
    mesh.log.warn = test.sinon.spy();
    mesh.start();
    await test.delay(3000);
    test.expect(mesh.log.warn.callCount).to.be(1);
    test
      .expect(mesh.log.warn.calledWith("awaiting startMethod '%s'", 'slowComponent.start()'))
      .to.be(true);
    await test.delay(1500); //Wait for slowComponent to start
    await mesh.stop({ reconnect: false });
  });
});
