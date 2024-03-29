## REST component

*the happner exchange can be exposed via a REST component [the test for now](https://github.com/happner/happner-2/blob/master/test/integration/rest/rest-component-secure.js)*

*for secure meshes, a rest command for logging in is called - on successful login, a token will be passed back, this token is used in the url for subsequent requests*

```javascript

var restClient = require('restler');

var operation = {
  username:'_ADMIN',
  password:'happn'
};

restClient.postJson('http://localhost:10000/rest/login', operation).on('complete', function(result){

  var token = result.data.token;

  //you can get a description of the services

  restClient.get('http://localhost:10000/rest/describe?happn_token=' + token).on('complete', function(result){
    done();
  });

  // methods are called via the URI /rest/method/[component name]/[method name]
  // the exposed component method is called with an array of arguments:
  restClient.postJson('http://localhost:10000/rest/method/testComponent/testMethod', [{'number':1}, {'number':2}]).on('complete', function(result){
      expect(result).to.be(3);
      done();
  });

  /* 
    assuming the exposed method (inside the mesh) looks like the following:
  */
  class ServerSideTestComponent {
    //opts and opts1 are interleaved between the special arguments $happn and $origin in the order that they appear in the array the http client is pushing up to the endpoint:
    async testMethod($happn, opts, $origin, opts1) {
      return opts.number + opts1.number;
    }
  }
  // THE OLD WAY: previously the arguments required naming in an object based structure (the system is backwards compatible with these types of calls)
  var operation = {
    parameters:{
      'opts':{'number':1},
      'opts1':{'number':2}
    }
  };
  restClient.postJson('http://localhost:10000/rest/method/testComponent/testMethod', operation).on('complete', function(result){
      expect(result).to.be(3);
      done();
  });
});

```

### Bearer token access

instead of accessing the REST endpoint using the token in a querystring argument, the token can be embedded in a bearer token request header:

```javascript

var restClient = require('restler');

var operation = {
  username:'_ADMIN',
  password:'happn'
};

restClient.postJson('http://localhost:10000/rest/login', operation).on('complete', function(result){

  var token = result.data.token;

  var options = {headers:{}};

  options.headers['authorization'] = 'Bearer ' + token;

  //you can get a description of the services

  restClient.get('http://localhost:10000/rest/describe', operation, options).on('complete', function(result){

    done();
  });

  // or call a component over the exchange, the operation contains the parameters for the method
  // methods are called via the URI /rest/method/[component name]/[method name]

  var restClient = require('restler');

  var operation = {
    parameters:{
      'opts':{'number':1}
    }
  };

  restClient.postJson('http://localhost:10000/rest/method/testComponent/method1', operation, options).on('complete', function(result){

    expect(result).to.be(3);

    done();
  });
});

```

*for unsecured meshes, no login is required, see [the test for now](https://github.com/happner/happner-2/blob/master/test/integration/rest/rest-component.js)*
