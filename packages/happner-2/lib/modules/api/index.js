module.exports = Api;

function Api() {}

Api.prototype.start = async function ($happn) {
  this.domain = $happn._mesh.config.domain || $happn._mesh.config.name;
  this.__componentAndMethodCache = {};
  await this.__attachAllExchangeRequests($happn);
};

Api.prototype.stop = async function ($happn) {
  this.__componentAndMethodCache = {};
  try {
    await this.__detachAllExchangeRequests($happn);
  } catch (e) {
    $happn.log.warn(`error detaching api component: ${e.message}`);
  }
};

Api.prototype.__destinationExists = function ($happn, component) {
  return $happn.exchange[component] != null;
};

Api.prototype.getComponentAndMethodFromPath = function (path) {
  //cached so we avoid splitting and slicing with every request
  if (!this.__componentAndMethodCache[path]) {
    const segments = path.split('/');
    this.__componentAndMethodCache[path] = segments.slice(segments.length - 2);
  }
  return this.__componentAndMethodCache[path];
};

Api.prototype.createAllExchangeRequestsHandler = function ($happn) {
  return (data, meta) => {
    const componentAndMethod = this.getComponentAndMethodFromPath(meta.path);
    if (this.__destinationExists($happn, componentAndMethod[0])) return;
    $happn._mesh.data.publish(
      data.callbackAddress,
      {
        args: [
          {
            name: 'bad endpoint',
            message: `Call to unconfigured component: [${componentAndMethod.join('.')}]`,
          },
        ],
      },
      (e) => {
        if (e) {
          let message = `unable to respond on unconfigured component: [${componentAndMethod.join(
            '.'
          )}]`;
          if (meta.eventOrigin) {
            message += `, origin session: ${meta.eventOrigin.id}`;
            if (meta.eventOrigin.username) message += `, origin user: ${meta.eventOrigin.username}`;
          }
          $happn.log.warn(`${message}, error: ${e.message}`);
        }
      }
    );
  };
};

Api.prototype.__attachAllExchangeRequests = async function ($happn) {
  this.exchangeRequestsEventId = await $happn._mesh.data.on(
    `/_exchange/requests/**`,
    this.createAllExchangeRequestsHandler($happn)
  );
};

Api.prototype.__detachAllExchangeRequests = async function ($happn) {
  if (this.exchangeRequestsEventId != null)
    await $happn._mesh.data.off(this.exchangeRequestsEventId);
};

Api.prototype.test = function (message, done) {
  done(null, message + ' tested ok');
};

Api.prototype.client = function ($happn, req, res) {
  /* serves: /api/client (script) */

  var script = $happn.asAdmin.tools.packages.api;

  if (req.headers['if-none-match'] === script.md5) {
    $happn.log.$$TRACE('client already has latest version ' + req.url);
    res.statusCode = 304; // <---- 304 Not Modified (RFC 7232)
    return res.end(); // <---- send nothing.
  }

  var header = {
    'Content-Type': 'text/javascript',
    'Cache-Control': 'max-age=0', // <---- client should always check
    ETag: script.md5, // <---- etag (see 'if-none-match')
  };

  if (script.gzip) {
    header['Content-Encoding'] = 'gzip'; // <---- script.data is gzipped
  }

  res.writeHead(200, header);
  $happn.log.$$TRACE('sending latest version ' + req.url);
  res.end(script.data);
};
