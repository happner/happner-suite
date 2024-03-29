module.exports = SecurityMiddleware;
const commons = require('happn-commons');
const fs = commons.fs;
const CONSTANTS = require('../../..').constants;
const devNull = require('dev-null');

SecurityMiddleware.prototype.initialize = initialize;
SecurityMiddleware.prototype.excluded = excluded;
SecurityMiddleware.prototype.process = _process;
SecurityMiddleware.prototype.__respondForbidden = __respondForbidden;
SecurityMiddleware.prototype.__respondUnauthorized = __respondUnauthorized;
SecurityMiddleware.prototype.__respond = __respond;

function SecurityMiddleware() {}

function initialize(config) {
  if (!config) config = {};
  this.config = config;

  if (!this.config.exclusions) this.config.exclusions = [];
}

function excluded(req, next) {
  if (this.config.exclusions.length > 0) {
    var url = req.url.split('?')[0];

    for (var patternIndex in this.config.exclusions) {
      var pattern = this.config.exclusions[patternIndex];

      if (pattern === '/') {
        if (url === pattern) {
          next();
          return true;
        }
        continue; // don't allow '/' exclusion into wildcardMatch (it always matches)
      }

      if (this.happn.services.utils.wildcardMatch(pattern, url)) {
        next();
        return true;
      }
    }
    return false;
  }
  return false;
}

function _process(req, res, next) {
  if (!this.happn.config.secure) return next();
  try {
    if (this.excluded(req, next)) return;
    if (req.url.substring(0, 1) !== '/') req.url = '/' + req.url;
    const parsedUrl = require('url').parse(req.url, true);
    const query = parsedUrl.query;
    let path = parsedUrl.pathname;
    const params = {};

    if (path === '/auth/request-nonce') {
      params.publicKey = this.happn.services.utils.getFirstMatchingProperty(
        ['publicKey', 'public_key', 'public', 'key', 'public-key'],
        query
      );
      try {
        const nonce = this.happn.services.security.createAuthenticationNonce(params);
        return this.__respond('nonce generated', nonce, null, res);
      } catch (e) {
        return next(e);
      }
    }

    if (path === '/auth/login') {
      params.username = this.happn.services.utils.getFirstMatchingProperty(
        ['user', 'username', 'u'],
        query
      );
      params.password = this.happn.services.utils.getFirstMatchingProperty(
        ['password', 'pwd', 'pass', 'p'],
        query
      );
      params.publicKey = this.happn.services.utils.getFirstMatchingProperty(
        ['publicKey', 'public_key', 'public', 'key', 'public-key', 'pk'],
        query
      );
      params.token = this.happn.services.utils.getFirstMatchingProperty(
        ['token', 'happn_token', 't'],
        query
      );
      params.digest = this.happn.services.utils.getFirstMatchingProperty(['digest'], query);
      //login type is stateless
      params.type = 0;

      const headers = this.happn.services.session.getClientUpgradeHeaders(req.headers);
      const address = { ip: req.connection.remoteAddress };

      if (headers[CONSTANTS.CLIENT_HEADERS.X_FORWARDED_FOR] != null)
        address.ip = headers[CONSTANTS.CLIENT_HEADERS.X_FORWARDED_FOR].split(',')[0];

      return this.happn.services.security.login(
        params,
        null,
        {
          data: { info: { _local: false } },
          headers,
          address,
          encrypted: req.connection.encrypted,
        },
        (e, session) => {
          if (e) {
            if (
              e.message === 'Invalid credentials' ||
              e.code === 401 ||
              e.message === 'use of _ADMIN credentials over the network is disabled'
            ) {
              return this.__respond('login failed', null, e, res, 401);
            }
            return this.__respond('login failed', null, e, res, 500);
          }
          this.__respond('login successful', session.token, null, res);
        }
      );
    }

    var session = this.happn.services.security.sessionFromRequest(req);
    if (!session) return this.__respondUnauthorized(req, res, 'invalid token format or null token');

    var url = require('url');
    path = '/@HTTP' + url.parse(req.url).pathname;
    session.type = 0; //stateless session

    this.happn.services.security.checkTokenUserId(session, (e, ok) => {
      if (e) return next(e);
      if (!ok) {
        return this.__respondUnauthorized(
          req,
          res,
          `token userid does not match userid for username: ${session.username}`
        );
      }
      if (path === '/@HTTP/auth/logout') {
        if (!this.happn.services.security.config.allowLogoutOverHttp) {
          return this.__respondForbidden(req, res, 'logouts over http are not allowed');
        }
        return this.happn.services.security.revokeToken(session.token, 'by user request', (e) => {
          if (e) {
            return next(e);
          }
          this.__respond('logout successful', session.token, null, res);
        });
      }
      this.happn.services.security.authorize(
        session,
        path,
        req.method.toLowerCase(),
        (e, authorized, reason) => {
          if (e) {
            if (e.toString().indexOf('AccessDenied') === 0)
              return this.__respondForbidden(req, res, 'unauthorized access to path ' + path);
            return next(e);
          }

          if (!authorized) {
            if (CONSTANTS.UNAUTHORISED_REASONS_COLLECTION.indexOf(reason) > -1)
              return this.__respondUnauthorized(
                req,
                res,
                `authorization failed for ${session.username}: ${reason}`
              );
            return this.__respondForbidden(req, res, 'unauthorized access to path ' + path);
          }
          req.happn_session = session; //used later if we are rechecking in security
          next();
        }
      );
    });
  } catch (e) {
    next(e);
  }
}

function __respondForbidden(req, res, message) {
  var _this = this;

  if (!_this.config.forbiddenResponsePath) {
    res.writeHead(403, 'unauthorized access', {
      'content-type': 'text/plain',
    });
    res.write(message);
    req.pipe(devNull()).once('finish', () => {
      res.end();
    });
    return;
  }

  fs.readFile(_this.config.forbiddenResponsePath, function (err, html) {
    if (err) {
      res.writeHead(500);
      return res.end(_this.happn.services.utils.stringifyError(err));
    }

    res.writeHead(403, 'unauthorized access', {
      'Content-Type': 'text/html',
    });
    res.end(html);
  });
}

function __respondUnauthorized(req, res, message) {
  var _this = this;

  if (!_this.config.unauthorizedResponsePath) {
    res.writeHead(401, 'unauthorized access', {
      'Content-Type': 'text/plain',
      'WWW-Authenticate': 'happn-auth',
    });
    res.write(message);
    req.pipe(devNull()).once('finish', () => {
      res.end();
    });
    return;
  }

  fs.readFile(_this.config.unauthorizedResponsePath, function (err, html) {
    if (err) {
      res.writeHead(500);
      return res.end(_this.happn.services.utils.stringifyError(err));
    }

    res.writeHead(401, 'unauthorized access', {
      'Content-Type': 'text/html',
      'WWW-Authenticate': 'happn-auth',
    });
    res.end(html);
  });
}

function __respond(message, data, error, res, code) {
  var responseString = '{"message":"' + message + '", "data":{{DATA}}, "error":{{ERROR}}}';

  var header = {
    'Content-Type': 'application/json',
  };

  if (error) {
    if (!code) code = 500;
    responseString = responseString.replace(
      '{{ERROR}}',
      this.happn.services.utils.stringifyError(error)
    );
  } else {
    if (!code) code = 200;
    responseString = responseString.replace('{{ERROR}}', 'null');
  }

  res.writeHead(code, header);

  if (data) responseString = responseString.replace('{{DATA}}', JSON.stringify(data));
  else responseString = responseString.replace('{{DATA}}', 'null');

  res.end(responseString);
}
