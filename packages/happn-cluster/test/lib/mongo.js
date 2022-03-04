var MongoClient = require('mongodb').MongoClient;

module.exports.clearCollection = function (url, collectionName, callback) {
  return new Promise((resolve, reject) => {
    const resolveInternal = (result) => {
      if (callback) callback(null, result);
      resolve(result);
    };
    const rejectInternal = (err) => {
      if (callback) callback(err);
      reject(err);
    };
    MongoClient.connect(url, function (err, client) {
      if (err) return rejectInternal(err);
      var db = client.db(collectionName);
      var collection = db.collection(collectionName);
      collection.drop(function (err) {
        if (err && err.message !== 'ns not found')
          //eslint-disable-next-line
          console.log('error clearing mongodb: ' + err.message);
        client.close(function (err) {
          if (err)
            //eslint-disable-next-line
            console.log('error closing mongodb: ' + err.message);
          resolveInternal();
        });
      });
    });
  });
};
/*

var MongoClient = require('mongodb').MongoClient;

module.exports = function (url, collectionName, callback) {
  // url assumes databaseName is the same collectionName
  MongoClient.connect(url + '/' + collectionName, function (err, db) {
    if (err) return callback(err);
    db.collection(collectionName, function (err, collection) {
      if (err) {
        db.close();
        return callback(err);
      }
      collection.drop(function (err) {
        db.close();
        if (err && err.message == 'ns not found') {
          return callback(null); // no such collection to delete
        }
        callback(err);
      });
    });
  });
};



*/
