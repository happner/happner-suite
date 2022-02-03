/* eslint-disable no-unused-vars */
require('happn-commons-test').describe({ timeout: 20000 }, function(test) {
  const service = require('../../index');
  const testId = test.commons.nanoid();
  const config = {
    url: 'mongodb://127.0.0.1:27017/happn'
  };

  const serviceInstance = new service(config);

  before('should initialize the service', function(callback) {
    serviceInstance.initialize(function(e) {
      if (e) return callback(e);

      if (!serviceInstance.happn)
        serviceInstance.happn = {
          services: {
            utils: {
              wildcardMatch: function(pattern, matchTo) {
                var regex = new RegExp(pattern.replace(/[*]/g, '.*'));
                var matchResult = matchTo.match(regex);

                if (matchResult) return true;

                return false;
              }
            }
          }
        };

      callback();
    });
  });

  after(function(done) {
    serviceInstance.stop(done);
  });

  it('sets data', function(callback) {
    var beforeCreatedOrModified = Date.now();

    setTimeout(function() {
      serviceInstance.upsert('/set/' + testId, { data: { test: 'data' } }, {}, function(e, result) {
        if (e) return callback(e);

        test.expect(result.data.test).to.equal('data');
        test.expect(result._meta.created > beforeCreatedOrModified).to.equal(true);
        test.expect(result._meta.modified > beforeCreatedOrModified).to.equal(true);

        callback();
      });
    }, 100);
  });

  it('gets data', function(callback) {
    serviceInstance.upsert('/get/' + testId, { data: { test: 'data' } }, function(e, created) {
      if (e) return callback(e);

      test.expect(created.data.test).to.equal('data');

      serviceInstance.find('/get/' + testId, {}, function(e, items) {
        if (e) return callback(e);

        test.expect(items[0].data.test).to.be('data');

        callback();
      });
    });
  });

  it('gets no data', function(callback) {
    var random = test.commons.nanoid();

    serviceInstance.find('/wontfind/' + random, {}, function(e, response) {
      if (e) return callback(e);

      test.expect(response).to.eql([]);

      callback();
    });
  });

  it('removes data', function(callback) {
    serviceInstance.upsert('/remove/' + testId, { test: 'data' }, function(e, response) {
      if (e) return callback(e);

      serviceInstance.remove('/remove/' + testId, function(e, response) {
        if (e) return callback(e);

        test.expect(response._meta.path).to.equal('/remove/' + testId);
        test.expect(response.data.removed).to.equal(1);

        callback();
      });
    });
  });

  it('removes multiple data', function(callback) {
    serviceInstance.upsert('/remove/multiple/1/' + testId, { test: 'data' }, function(e) {
      if (e) return callback(e);

      serviceInstance.upsert('/remove/multiple/2/' + testId, { test: 'data' }, function(e) {
        if (e) return callback(e);

        serviceInstance.remove('/remove/multiple/*', function(e, response) {
          if (e) return callback(e);

          test.expect(response._meta.path).to.equal('/remove/multiple/*');

          test.expect(response.data.removed).to.equal(2);

          callback();
        });
      });
    });
  });

  it('gets data with wildcard', function(callback) {
    serviceInstance.upsert('/get/multiple/1/' + testId, { data: { test: 'data' } }, function(e) {
      if (e) return callback(e);

      serviceInstance.upsert('/get/multiple/2/' + testId, { data: { test: 'data' } }, function(e) {
        if (e) return callback(e);

        serviceInstance.find('/get/multiple/*/' + testId, function(_e, response) {
          test.expect(response.length).to.equal(2);
          test.expect(response[0].data.test).to.equal('data');
          test.expect(response[1].data.test).to.equal('data');
          callback();
        });
      });
    });
  });

  it('gets data with complex search', function(callback) {
    var test_path_end = test.commons.nanoid();

    var complex_obj = {
      regions: ['North', 'South'],
      towns: ['North.Cape Town'],
      categories: ['Action', 'History'],
      subcategories: ['Action.angling', 'History.art'],
      keywords: ['bass', 'Penny Siopis'],
      field1: 'field1'
    };

    var criteria1 = {
      $or: [
        { 'data.regions': { $in: ['North', 'South', 'East', 'West'] } },
        { 'data.towns': { $in: ['North.Cape Town', 'South.East London'] } },
        { 'data.categories': { $in: ['Action', 'History'] } }
      ],
      'data.keywords': { $in: ['bass', 'Penny Siopis'] }
    };

    var options1 = {
      sort: { field1: 1 },
      limit: 1
    };

    var criteria2 = null;

    var options2 = {
      fields: null,
      sort: { field1: 1 },
      limit: 2
    };

    // serviceInstance.upsert('/get/multiple/1/' + testId, {data:{"test":"data"}}, {}, false, function(e, response){
    serviceInstance.upsert(
      '/1_eventemitter_embedded_sanity/' + testId + '/testsubscribe/data/complex/' + test_path_end,
      { data: complex_obj },
      function(e) {
        test.expect(e == null).to.be(true);
        serviceInstance.upsert(
          '/1_eventemitter_embedded_sanity/' +
            testId +
            '/testsubscribe/data/complex/' +
            test_path_end +
            '/1',
          { data: complex_obj },
          function(e) {
            test.expect(e == null).to.be(true);
            serviceInstance.upsert(
              '/1_eventemitter_embedded_sanity/' +
                testId +
                '/testsubscribe/data/complex/' +
                test_path_end +
                '/2',
              { test: 'data' },
              function(e) {
                test.expect(e == null).to.be(true);

                serviceInstance.find(
                  '/1_eventemitter_embedded_sanity/' + testId + '/testsubscribe/data/complex*',
                  {
                    criteria: criteria1,
                    options: options1
                  },
                  function(e, search_result) {
                    test.expect(e == null).to.be(true);
                    test.expect(search_result.length === 1).to.be(true);

                    serviceInstance.find(
                      '/1_eventemitter_embedded_sanity/' + testId + '/testsubscribe/data/complex*',
                      {
                        criteria: criteria2,
                        options: options2
                      },
                      function(e, search_result) {
                        test.expect(e == null).to.be(true);
                        test.expect(search_result.length === 2).to.be(true);
                        callback(e);
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });

  it('gets data with $not', function(done) {
    var test_obj = {
      data: 'ok'
    };

    var test_obj1 = {
      data: 'notok'
    };

    serviceInstance.upsert('/not_get/' + testId + '/ok/1', test_obj, function(e) {
      test.expect(e == null).to.be(true);

      serviceInstance.upsert('/not_get/' + testId + '/_notok_/1', test_obj1, function(e) {
        test.expect(e == null).to.be(true);

        var listOptions = { criteria: { path: { $not: /.*_notok_.*/ } } };

        serviceInstance.find('/not_get/' + testId + '/*', listOptions, function(e, search_result) {
          test.expect(e == null).to.be(true);

          test.expect(search_result.length === 1).to.be(true);

          done();
        });
      });
    });
  });

  it('does a sort and limit', function(done) {
    var itemCount = 100;

    var randomItems = [];

    var test_string = test.commons.nanoid();

    var base_path = '/sort_and_limit/' + test_string + '/';

    var async = require('async');

    for (var i = 0; i < itemCount; i++) {
      var item = {
        item_sort_id: i + Math.floor(Math.random() * 1000000)
      };

      randomItems.push(item);
    }

    async.eachSeries(
      randomItems,

      function(item, callback) {
        var testPath = base_path + item.item_sort_id;

        serviceInstance.upsert(testPath, { data: item }, { noPublish: true }, function(e) {
          if (e) return callback(e);

          callback();
        });
      },

      function(e) {
        if (e) return done(e);

        //ascending
        randomItems.sort(function(a, b) {
          return a.item_sort_id - b.item_sort_id;
        });

        serviceInstance.find(
          base_path + '*',
          { options: { sort: { 'data.item_sort_id': 1 } }, limit: 50 },
          function(e, items) {
            if (e) return done(e);

            for (var itemIndex in items) {
              if (itemIndex >= 50) break;

              var item_from_mongo = items[itemIndex];

              var item_from_array = randomItems[itemIndex];

              if (item_from_mongo.data.item_sort_id !== item_from_array.item_sort_id)
                return done(new Error('ascending sort failed'));
            }

            //ascending
            randomItems.sort(function(a, b) {
              return b.item_sort_id - a.item_sort_id;
            });

            serviceInstance.find(
              base_path + '/*',
              { options: { sort: { 'data.item_sort_id': -1 } }, limit: 50 },
              function(e, items) {
                if (e) return done(e);

                for (var itemIndex in items) {
                  if (itemIndex >= 50) break;

                  var item_from_mongo = items[itemIndex];
                  var item_from_array = randomItems[itemIndex];

                  if (item_from_mongo.data.item_sort_id !== item_from_array.item_sort_id)
                    return done(new Error('descending sort failed'));
                }

                done();
              }
            );
          }
        );
      }
    );
  });

  it('increments a data point', function(done) {
    var async = require('async');

    var test_string = test.commons.nanoid();
    var test_base_url = '/increment/' + testId + '/' + test_string;

    async.timesSeries(
      10,
      function(time, timeCB) {
        //path, counterName, options, callback
        serviceInstance.increment(test_base_url, 'counter', 1, timeCB);
      },
      function(e) {
        if (e) return done(e);

        serviceInstance.find(test_base_url, {}, function(e, result) {
          if (e) return done(e);

          test.expect(result[0].data.counter.value).to.be(10);

          done();
        });
      }
    );
  });

  it('increments a data point, multiple guages', function(done) {
    var async = require('async');

    var test_string = test.commons.nanoid();
    var test_base_url = '/increment/' + testId + '/' + test_string;

    async.timesSeries(
      10,
      function(time, timeCB) {
        //path, counterName, options, callback
        serviceInstance.increment(test_base_url, 'counter-' + time, 1, timeCB);
      },
      function(e) {
        if (e) return done(e);

        serviceInstance.find(test_base_url, {}, function(e, result) {
          if (e) return done(e);

          test.expect(result[0].data['counter-0'].value).to.be(1);
          test.expect(result[0].data['counter-1'].value).to.be(1);
          test.expect(result[0].data['counter-2'].value).to.be(1);
          test.expect(result[0].data['counter-3'].value).to.be(1);
          test.expect(result[0].data['counter-4'].value).to.be(1);
          test.expect(result[0].data['counter-5'].value).to.be(1);
          test.expect(result[0].data['counter-6'].value).to.be(1);
          test.expect(result[0].data['counter-7'].value).to.be(1);
          test.expect(result[0].data['counter-8'].value).to.be(1);
          test.expect(result[0].data['counter-9'].value).to.be(1);

          done();
        });
      }
    );
  });
});
