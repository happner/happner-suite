require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  var mesh;
  function nestedFunc(cb) {
    process.nextTick(cb);
  }
  before('start mesh', function (done) {
    test.Mesh.create({
      modules: {
        testComponent: {
          instance: {
            unvalidatedMethod: function ($happn, _notInArgs, _notInArgs1, callback) {
              try {
                return nestedFunc(() => {
                  throw new Error('test');
                });
              } catch (e) {
                console.log('error is: ', e);
                callback(e);
              }
              // $happn.asAdmin.exchange.data.set('test', {}, () => {
              //   return callback();
              // });
            },
            unconfiguredMethod: function (optional, callback) {
              if (typeof optional === 'function') {
                callback = optional;
                optional = {
                  some: 'default option',
                };
              }
              callback(null, optional);
            },
            configuredmethod: function (optional, callback) {
              if (typeof optional === 'function') {
                callback = optional;
                optional = {
                  some: 'default option',
                };
              }
              callback(null, optional);
            },
          },
        },
      },
      components: {
        data: {},
        testComponent: {
          schema: {
            methods: {
              // 'unconfiguredMethod': {},
              configuredmethod: {
                type: 'async',
                parameters: [
                  { name: 'optional', required: false }, // <-------------- optional argument
                  { name: 'callback', required: true, type: 'callback' },
                ],
                callback: {
                  parameters: [{ name: 'error', type: 'error' }, { name: 'echoOptional' }],
                },
              },
            },
          },
        },
      },
    })
      .then(function (_mesh) {
        mesh = _mesh;
        done();
      })
      .catch(done);
  });

  after('stop mesh', function (done) {
    if (!mesh) return done();
    mesh.stop({ reconnect: false }, done);
  });

  context('using callback', function () {
    //
    // failing test! remove "x"
    //

    xit('supports call to configuredMethod WITHOUT optional argument', function (done) {
      // this times out...
      this.timeout(300);
      mesh.exchange.testComponent.configuredmethod(function (error, echoOptional) {
        try {
          echoOptional.should.eql({ some: 'default option' });
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('supports call to configuredMethod WITH optional argument', function (done) {
      this.timeout(300);
      mesh.exchange.testComponent.configuredmethod(
        { some: 'option' },
        function (error, echoOptional) {
          try {
            echoOptional.should.eql({ some: 'option' });
            done();
          } catch (e) {
            done(e);
          }
        }
      );
    });

    it('supports call to unconfiguredMethod WITHOUT optional argument', function (done) {
      this.timeout(300);
      mesh.exchange.testComponent.unconfiguredMethod(function (error, echoOptional) {
        try {
          echoOptional.should.eql({ some: 'default option' });
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('supports call to unconfiguredMethod WITH optional argument', function (done) {
      this.timeout(300);
      mesh.exchange.testComponent.unconfiguredMethod(
        { some: 'option' },
        function (error, echoOptional) {
          try {
            echoOptional.should.eql({ some: 'option' });
            done();
          } catch (e) {
            done(e);
          }
        }
      );
    });

    it.only('supports call to method with a bad callback argument', function (done) {
      this.timeout(300);
      mesh.exchange.testComponent.unvalidatedMethod((err) => {
        test.expect(err.message).to.be('callback is not a function');
        done();
      });
    });
  });

  context('using promise', function () {
    //
    // failing test! remove "x"
    //

    it.only('supports call to method with a bad callback argument, promise', async () => {
      this.timeout(300);
      let errorMessage;
      try {
        await mesh.exchange.testComponent.unvalidatedMethod();
      } catch (error) {
        errorMessage = error.message;
      }
      test.expect(errorMessage).to.be('callback is not a function');
    });

    xit('supports call to configuredMethod WITHOUT optional argument', function (done) {
      this.timeout(300);
      mesh.exchange.testComponent
        .configuredmethod()
        .then(function (echoOptional) {
          echoOptional.should.eql({ some: 'default option' });
        })
        .then(done)
        .catch(done);
    });

    it('supports call to configuredMethod WITH optional argument', function (done) {
      this.timeout(300);
      mesh.exchange.testComponent
        .configuredmethod({ some: 'option' })
        .then(function (echoOptional) {
          echoOptional.should.eql({ some: 'option' });
        })
        .then(done)
        .catch(done);
    });

    it('supports call to unconfiguredMethod WITHOUT optional argument', function (done) {
      this.timeout(300);
      mesh.exchange.testComponent
        .unconfiguredMethod()
        .then(function (echoOptional) {
          echoOptional.should.eql({ some: 'default option' });
        })
        .then(done)
        .catch(done);
    });

    it('supports call to unconfiguredMethod WITH optional argument', function (done) {
      this.timeout(300);
      mesh.exchange.testComponent
        .unconfiguredMethod({ some: 'option' })
        .then(function (echoOptional) {
          echoOptional.should.eql({ some: 'option' });
        })
        .then(done)
        .catch(done);
    });
  });
});
