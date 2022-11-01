module.exports = Component;
var methodCalls = 0;
var webMethodCalls = 0;

function Component() {}

Component.prototype.start = function ($happn, callback) {
  callback();
};

Component.prototype.stop = function ($happn, callback) {
  callback();
};

Component.prototype.brokeredMethod1 = function ($happn, $req_headers, callback) {
  let headers = '';
  if (typeof $req_headers === 'function') {
    callback = $req_headers;
  } else headers = ':true';

  methodCalls++;
  $happn.emit(`test/${methodCalls}`, {}, () => {
    if (methodCalls % 1000 === 0)
      // eslint-disable-next-line no-console
      console.log(`brokeredMethod1 call count:::${methodCalls}`);
    callback(null, `${$happn.info.mesh.name}:remoteComponent1:brokeredMethod1${headers}`);
  });
};

Component.prototype.brokeredMethod2 = function ($happn, callback) {
  callback(null, $happn.info.mesh.name + ':remoteComponent1:brokeredMethod2');
};

Component.prototype.brokeredMethod3 = function ($happn, $origin, param, callback) {
  if (typeof param === 'function') {
    callback = param;
    param = null;
  }
  callback(
    null,
    `${$happn.info.mesh.name}:remoteComponent1:brokeredMethod3:${param}:${$origin.username}`
  );
};

Component.prototype.brokeredMethod4 = function ($happn, arg1, arg2, $origin, callback) {
  if (typeof arg2 === 'function') {
    callback = arg2;
    arg2 = null;
  }
  if (typeof arg1 === 'function') {
    callback = arg1;
    arg1 = null;
  }
  arg1 = arg1 || 0;
  arg2 = arg2 || 0;
  callback(
    null,
    `${$happn.info.mesh.name}:remoteComponent1:brokeredMethod4:${$origin.username}:${arg1 + arg2}`
  );
};

Component.prototype.brokeredMethod5 = async function ($happn, $origin, param) {
  return `${$happn.info.mesh.name}:remoteComponent1:brokeredMethod5:${param}:${$origin.username}`;
};

Component.prototype.brokeredMethod6 = async function ($happn, arg1, arg2, $origin) {
  arg1 = arg1 || 0;
  arg2 = arg2 || 0;
  return `${$happn.info.mesh.name}:remoteComponent1:brokeredMethod6:${$origin.username}:${
    arg1 + arg2
  }`;
};

Component.prototype.testJSON = function (req, res) {
  webMethodCalls++;
  if (webMethodCalls % 1000 === 0)
    // eslint-disable-next-line no-console
    console.log(`testJSON web call count:::${webMethodCalls}`);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ test: 'data' }));
};

Component.prototype.testJSONSticky = function ($happn, req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ran_on: `${$happn.info.mesh.name}` }));
};

Component.prototype.brokeredEventEmitMethod = function ($happn, callback) {
  $happn.emit('/brokered/event1', {
    brokered: {
      event: {
        data: {
          from: $happn.info.mesh.name,
        },
      },
    },
  });
  callback(null, $happn.info.mesh.name + ':remoteComponent1:brokeredEventEmitMethod');
};
