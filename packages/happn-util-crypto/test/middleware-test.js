describe('middleware-test', function() {
  var chai = require('chai');
  var expect = chai.expect;
  var crypto = require('../lib/crypto');
  var cryptoUtil = new crypto();
  var connect = require('connect');

  /*
	This test demonstrates starting up the happn service - 
	the authentication service will use authTokenSecret to encrypt web tokens identifying
	the logon session. The utils setting will set the system to log non priority information
	*/

  var server;

  it('should initialize the service', function(callback) {
    this.timeout(20000);

    try {
      //Lets require/import the HTTP module
      var http = require('http');

      //Create a server
      var app = connect();

      cryptoUtil.attacheMiddleware(app);
      cryptoUtil.attacheMiddleware(app, '/happn_util_crypto/alternative_route');

      server = http.createServer(app);

      //Lets start our server
      server.listen(8080, callback);
    } catch (e) {
      callback(e);
    }
  });

  after(function() {
    server.close();
  });

  var getBody = function(url, callback) {
    require('request')(
      {
        uri: url,
        method: 'GET'
      },
      function(e, r, b) {
        if (!e) {
          callback(null, b);
        } else callback(e);
      }
    );
  };

  it('should fetch the browser client on the standard path', function(callback) {
    this.timeout(5000);

    try {
      getBody('http://127.0.0.1:8080/happn_util_crypto', function(e, body) {
        if (e) return callback(e);
        expect(body.substring(0, 21)).to.equal('/**HAPPN CRYPTO UTILS');
        callback();
      });
    } catch (e) {
      callback(e);
    }
  });

  it('should fetch the browser client on the alternative path', function(callback) {
    this.timeout(5000);

    try {
      getBody('http://127.0.0.1:8080/happn_util_crypto/alternative_route', function(e, body) {
        if (e) return callback(e);

        expect(body.substring(0, 21)).to.equal('/**HAPPN CRYPTO UTILS');
        callback();
      });
    } catch (e) {
      callback(e);
    }
  });
});
