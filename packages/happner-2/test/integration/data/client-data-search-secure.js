require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  var Mesh = require('../../..');
  var meshInstance;
  var meshClientInstance;
  var test_id = Date.now() + '_' + test.newid();

  var TestModule1 = {
    setSharedData: function ($happn, path, data, callback) {
      $happn.exchange.data.set(path, data, callback);
    },
  };

  var TestModule2 = {
    getSharedData: function ($happn, path, callback) {
      $happn.exchange.data.get(path, callback);
    },
  };

  before(function (done) {
    Mesh.create({
      name: 'mesh' + test_id,

      happn: {
        persist: true,
        secure: true,
        adminPassword: test_id,
      },

      modules: {
        module1: {
          instance: TestModule1,
        },
        module2: {
          instance: TestModule2,
        },
      },

      components: {
        data: {},
        module1: {},
        module2: {},
      },
    })
      .then(function (mesh) {
        meshInstance = mesh;
        meshClientInstance = new Mesh.MeshClient();
        meshClientInstance
          .login({
            username: '_ADMIN',
            password: test_id,
          })
          .then(done);
      })
      .catch(done);
  });

  after(function (done) {
    meshInstance.stop({ reconnect: false }, done);
  });

  context('direct use', function () {
    it('can get using criteria', function (done) {
      meshInstance.exchange.data.set(
        'movie/war',
        { name: 'crimson tide', genre: 'war' },
        function (e) {
          if (e) return done(e);

          var options = {
            sort: { name: 1 },
          };

          var criteria = {
            name: 'crimson tide',
          };

          meshInstance.exchange.data.get(
            'movie/*',
            { criteria: criteria, options: options },
            function (e, result) {
              if (e) return done(e);

              result.length.should.eql(1);
              done();
            }
          );
        }
      );
    });

    it('can count using criteria', function (done) {
      meshInstance.exchange.data.set(
        'movie/scifi',
        { name: 'interstellar', genre: 'scifi' },
        function (e) {
          if (e) return done(e);

          var options = {
            sort: { name: 1 },
          };

          var criteria = {
            name: 'interstellar',
          };

          meshInstance.exchange.data.count(
            'movie/*',
            { criteria: criteria, options: options },
            function (e, result) {
              if (e) return done(e);

              test.expect(result.value).to.eql(1);
              done();
            }
          );
        }
      );
    });

    it("can count using criteria that don't match", function (done) {
      meshInstance.exchange.data.set(
        'movie/scifi',
        { name: 'the martian', genre: 'scifi' },
        function (e) {
          if (e) return done(e);

          var options = {
            sort: { name: 1 },
          };

          var criteria = {
            name: 'no name',
          };

          meshInstance.exchange.data.count(
            'movie/*',
            { criteria: criteria, options: options },
            function (e, result) {
              if (e) return done(e);

              test.expect(result.value).to.eql(0);
              done();
            }
          );
        }
      );
    });

    //DOESNT WORK USING NEDB PLUGIN
    it('can get using criteria, limit to fields', function (done) {
      meshInstance.exchange.data.set(
        'movie/war/ww2',
        { name: 'crimson tide', genre: 'ww2' },
        function (e) {
          if (e) return done(e);

          var options = {
            fields: { name: 1 },
          };

          var criteria = {
            genre: 'ww2',
          };

          meshInstance.exchange.data.get(
            'movie/*',
            { criteria: criteria, options: options },
            function (e, result) {
              if (e) return done(e);

              test.expect(result[0].genre).to.be(undefined);
              result[0].name.should.eql('crimson tide');
              result.length.should.eql(1);

              done();
            }
          );
        }
      );
    });

    it('can get the latest record', function (done) {
      var indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      test.async.eachSeries(
        indexes,
        function (index, eachCallback) {
          meshInstance.exchange.data.set(
            'movie/family/' + index,
            { name: 'the black stallion', genre: 'family' },
            eachCallback
          );
        },
        function (e) {
          if (e) return done(e);

          var options = {
            sort: { '_meta.created': -1 },
            limit: 1,
          };

          var criteria = {
            genre: 'family',
          };

          var latestResult;

          meshInstance.exchange.data.get(
            'movie/*',
            { criteria: criteria, options: options },
            function (e, result) {
              if (e) return done(e);

              result.length.should.eql(1);

              latestResult = result[0];

              test.expect(latestResult._meta.created).to.not.be(null);
              test.expect(latestResult._meta.created).to.not.be(undefined);

              meshInstance.exchange.data.get('movie/family/*', function (e, result) {
                if (e) return done(e);

                for (var resultItemIndex in result) {
                  var resultItem = result[resultItemIndex];

                  test.expect(resultItem._meta.created).to.not.be(null);
                  test.expect(resultItem._meta.created).to.not.be(undefined);

                  if (
                    resultItem._meta.path !== latestResult._meta.path &&
                    resultItem._meta.created > latestResult._meta.created
                  )
                    return done(new Error('the latest result is not the latest result...'));
                }

                done();
              });
            }
          );
        }
      );
    });
  });

  context('client use', function () {
    it('can get using criteria', function (done) {
      meshClientInstance.exchange.data.set(
        'movie/comedy',
        { name: 'nkandla', genre: 'comedy' },
        function (e) {
          if (e) return done(e);

          var options = {
            sort: { '_meta.created': 1 },
          };

          var criteria = {
            genre: 'comedy',
          };

          meshClientInstance.exchange.data.get(
            'movie/*',
            { criteria: criteria, options: options },
            function (e, result) {
              if (e) return done(e);

              result.length.should.eql(1);
              result[0].name.should.eql('nkandla');
              done();
            }
          );
        }
      );
    });

    it('can count using criteria', function (done) {
      meshClientInstance.exchange.data.set(
        'movie/scifi',
        { name: 'star wars', genre: 'scifi' },
        function (e) {
          if (e) return done(e);

          var options = {
            sort: { name: 1 },
          };

          var criteria = {
            name: 'star wars',
          };

          meshClientInstance.exchange.data.count(
            'movie/*',
            { criteria: criteria, options: options },
            function (e, result) {
              if (e) return done(e);

              test.expect(result.value).to.eql(1);
              done();
            }
          );
        }
      );
    });

    it("can count using criteria that don't match", function (done) {
      meshClientInstance.exchange.data.set(
        'movie/scifi',
        { name: 'star wars 2', genre: 'scifi' },
        function (e) {
          if (e) return done(e);

          var options = {
            sort: { name: 1 },
          };

          var criteria = {
            name: 'no name',
          };

          meshClientInstance.exchange.data.count(
            'movie/*',
            { criteria: criteria, options: options },
            function (e, result) {
              if (e) return done(e);

              test.expect(result.value).to.eql(0);
              done();
            }
          );
        }
      );
    });
  });

  context('client data use', function () {
    it('can get using criteria', function (done) {
      meshClientInstance.data.set(
        'movie/drama',
        { name: 'nkandla2', genre: 'drama' },
        function (e) {
          if (e) return done(e);

          var options = {
            sort: { name: 1 },
          };

          var criteria = {
            genre: 'drama',
          };

          meshClientInstance.data.get(
            'movie/*',
            { criteria: criteria, options: options },
            function (e, result) {
              if (e) return done(e);

              result.length.should.eql(1);
              result[0].name.should.eql('nkandla2');

              done();
            }
          );
        }
      );
    });

    it('can count using criteria', function (done) {
      meshClientInstance.data.set(
        'movie/scifi',
        { name: 'star wars', genre: 'scifi' },
        function (e) {
          if (e) return done(e);

          var options = {
            sort: { name: 1 },
          };

          var criteria = {
            name: 'star wars',
          };

          meshClientInstance.data.count(
            'movie/*',
            { criteria: criteria, options: options },
            function (e, result) {
              if (e) return done(e);

              test.expect(result.value).to.eql(1);
              done();
            }
          );
        }
      );
    });

    it("can count using criteria that don't match", function (done) {
      meshClientInstance.data.set(
        'movie/scifi',
        { name: 'star wars 2', genre: 'scifi' },
        function (e) {
          if (e) return done(e);

          var options = {
            sort: { name: 1 },
          };

          var criteria = {
            name: 'no name',
          };

          meshClientInstance.data.count(
            'movie/*',
            { criteria: criteria, options: options },
            function (e, result) {
              if (e) return done(e);

              test.expect(result.value).to.eql(0);
              done();
            }
          );
        }
      );
    });
  });
});
