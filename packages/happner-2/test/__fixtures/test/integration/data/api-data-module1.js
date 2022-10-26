/**
 * Created by Johan on 4/14/2015.
 * Updated by S.Bishop 6/1/2015.
 */
const Assert = require('assert');

module.exports = function (options) {
  return new Component1(options);
};

function Component1(options) {

  this.storeData = function ($happn, path, data, parameters, callback) {
    $happn.data.set(path, data, parameters, callback);
  };

  this.onCount = 0;

  this.getOnCount = function ($happn, callback) {
    callback(null, this.onCount);
  };

  this.incrementGauge = function ($happn, path, gauge, increment, callback) {
    $happn.data.increment(path, gauge, increment, callback);
  };

  this.getCount = function($happn, path, callback) {
    $happn.data.count(path, callback);
  };

  this.deleteWithOptions = async function($happn) {
    await $happn.data.set('test/delete/1', { test: 1 });
    await $happn.data.set('test/delete/2', { test: 2 });
    await $happn.data.set('test/delete/3', { test: 3 });
    let items = (await $happn.data.get('test/delete/*')).map((item) => item.test);
    Assert.equal(items.length, 3);
    Assert.equal(items[1], 2);
    await $happn.data.remove('test/delete/*', {
      criteria: {
        test: { $eq: 2 },
      },
    });
    items = (await $happn.data.get('test/delete/*')).map((item) => item.test);
    Assert.equal(items.length, 2);
    Assert.equal(items[1], 3);
    await $happn.data.remove('test/delete/*');
    items = (await $happn.data.get('test/delete/*')).map((item) => item.test);
    Assert.equal(items.length, 0);
  }

  this.start = function ($happn, arg, callback) {

    var _this = this;

    //path, parameters, handler, done
    $happn.data.on('*/*/*/*', function (result) {
        _this.onCount++;
      },
      function (e) {
        if (e) return callback(e);
        callback();
      });
  };

  this.stop = function () {

  };
}
