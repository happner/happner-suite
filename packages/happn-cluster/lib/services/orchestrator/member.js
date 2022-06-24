module.exports = Member;

var property = require('../../utils/property');
var getter = require('../../utils/getter');

function Member(parameters) {
  var member = parameters.member;
  var memberFromLogin = parameters.memberFromLogin;
  var orchestrator = parameters.orchestrator;
  var localClient = parameters.localClient;
  var clusterName = parameters.clusterName;

  property(this, 'orchestrator', orchestrator);
  property(this, 'log', orchestrator.log);
  property(this, 'clusterName', clusterName);
  property(this, 'HappnClient', orchestrator.HappnClient);

  property(this, 'reservedMeta', [
    'created',
    'modified',
    'path',
    'type',
    'status',
    'published',
    'eventId',
    'sessionId',
    'action',
    'channel',
    'sessionId',
    'consistency',
    'publicationId',
  ]);

  // this member represents self in the cluster
  this.self = false;

  // happn.name
  this.name = null;

  // this member's id (remote swim host)
  this.memberId = null;

  // true when swim discovers
  this.member = false;

  // login in progress
  // this.connectingTo = true;

  // got happn connection to remote happn
  this.connectedTo = false;

  // got happn connection from remote happn
  this.connectedFrom = false;

  // set to false on subscription success
  this.subscribedTo = false;

  // TODO: not truly stabilised until we know the remote has subscribed to us
  this.subscribedFrom = true; // (not possible to detect yet)

  // orchestrator.stabilized() discovers this error and this
  // whole cluster node fails to start because it could not
  // login to one of the other members
  //
  // populate it with happn login error or subscribe error
  this.error = null;

  if (localClient) {
    this.self = true;
    this.name = this.orchestrator.happn.name;
    this.connectedTo = true; // member does not connect to...
    this.connectedFrom = true; // ...or from itself
    this.connectingTo = false;
    this.subscribedTo = true; // member does not replicate itself
    getter(this, 'client', localClient);
  }

  // member present only if SWIM got first notice of new member
  if (member) {
    this.memberId = member.memberId;
    this.member = true;
    this.connect(member);
  }

  // memberFromLogin present only if happn got first notice of new member (via inbound login)
  if (memberFromLogin) {
    this.memberId = memberFromLogin.memberId;
    this.name = memberFromLogin.name;
    this.connect(memberFromLogin);
  }
}

Member.prototype.removeMembership = function () {
  this.member = false; // swim detected faulty
};

Member.prototype.addMembership = function () {
  this.member = true; // swim detected join
};

Member.prototype.stop = require('util').promisify(function (callback) {
  if (this.client == null || this.client.status === 2) return callback(); //dont try disconnect again

  return this.client.disconnect((e) => {
    this.client.session = null;
    callback(e);
  });
  // TODO: handle stop on client that is busy connecting...
});

Member.prototype.__onHappnDisconnect = function () {
  this.log.$$TRACE('disconnected/reconnecting to (->) %s/%s', this.clusterName, this.name);
  this.log.$$TRACE('arguments', arguments);

  if (!this.connectedTo) return;
  this.connectedTo = false;

  if (!this.member) {
    // swim also has this as departed the cluster, remove it
    this.orchestrator.removePeer(this);
    this.orchestrator.removeMember(this);
    return;
  }

  // otherwise, leave it in reconnect loop until swim confirms
  // but remove from peers as unusable
  this.orchestrator.removePeer(this);
};

Member.prototype.__onHappnReconnect = function () {
  this.log.$$TRACE('reconnected to (->) %s/%s', this.clusterName, this.name);
  if (this.connectedTo) return;
  this.connectedTo = true;
  this.orchestrator.__stateUpdate();
};

Member.prototype.__subscribe = function (path) {
  var _this = this;
  return new Promise(function (resolve, reject) {
    _this.client.on(path, null, _this.__createReplicationEventHandler(), function (error) {
      if (error) {
        _this.log.fatal('could not subscribe to %s at %s', path, _this.name, error);
        return reject(error);
      }
      resolve();
    });
  });
};

Member.prototype.__createReplicationEventHandler = function () {
  var _this = this;
  var subscription = this.orchestrator.happn.services.subscription;
  var publisher = this.orchestrator.happn.services.publisher;

  // Convert event received by subscription to remote peer into the format
  // necessary to re publish directly to local clients !ONLY!
  // (not publishing back into the cluster to prevent infinite loop)
  //
  // Samples:
  //
  // Incoming data: {
  //   "testField": "testValue"
  // }
  //
  // Incoming meta: {
  //   "created": 1475681648606,
  //   "modified": 1475681648606,
  //   "path": "/EVENT_PROPAGATION_DATA/test1",
  //   "type": "data",
  //   "sessionId": "40e5f13c-cd4f-413e-96c8-7815d4189ec0",
  //   "action": "/SET@/EVENT_PROPAGATION_DATA/test1",
  //   "channel": "/ALL@/*"
  // }
  //
  // ... convert to ...
  //
  // For publishing: expected MESSAGE: {
  //   "action": "set",
  //   "eventId": 3, <------------------------------------------------- unable to map (appears to not matter)
  //   "path": "/EVENT_PROPAGATION_DATA/test1",
  //   "data": {
  //     "testField": "testValue"
  //   },
  //   "sessionId": "b9f72c4e-b17b-458f-b109-0092a51351f5",
  //   "protocol": "1.1.0", <------------------------------------------ ?
  //   "options": {}
  // }
  //
  // For publishing: expected PAYLOAD: {
  //   "data":{
  //     "testField": "testValue"
  //   },
  //   "_meta": {
  //     "created": 1475681381390,
  //     "modified": 1475681381390,
  //     "path": "/EVENT_PROPAGATION_DATA/test1",
  //     "type": "response", <----------------------------------------- unable to map (appears to not matter)
  //     "status": "ok", <--------------------------------------------- unable to map (appears to not matter)
  //     "published": false, <----------------------------------------- unable to map (appears to not matter)
  //     "eventId": 3, <----------------------------------------------- unable to map (appears to not matter)
  //     "sessionId": "b9f72c4e-b17b-458f-b109-0092a51351f5",
  //     "action": "set"
  //
  //     "channel"
  //     "sessionId"
  //     "consistency"
  //     "publicationId"
  //
  //   }
  // }
  //
  //

  return function rePublisher(data, meta) {
    var action, payload, message, eventId;

    var emitError = function (error, message) {
      if (!_this.orchestrator._events || !_this.orchestrator._events.error) {
        // only log fatal if there is no error handler
        _this.log.fatal(message, error);
      }
      // will crash process unless there is an error listener
      return _this.orchestrator.emit('error', error);
    };

    try {
      action = meta.action.substr(meta.action.indexOf('/') + 1, meta.action.indexOf('@') - 1);
      action = action.toLowerCase();

      meta.action = action;
      delete meta.type;

      eventId = meta.publicationId.split('-').pop();

      payload = { data: data, _meta: meta, action: action };
      message = {
        session: {
          id: meta.sessionId,
        },
        request: {
          action: action,
          path: meta.path,
          data: data,
          eventId: eventId,
        },
        response: payload,
      };

      // don't emit back into cluster
      message.request.options = message.options || {};
      message.request.options.noCluster = true;

      Object.keys(meta).forEach(function (key) {
        if (_this.reservedMeta.indexOf(key) >= 0) return;
        message.request.options.meta = message.request.options.meta || {};
        message.request.options.meta[key] = meta[key];
      });
    } catch (error) {
      // happn changed meta format, unable to replicate, make big noise
      return emitError(error, 'unexpected meta format, cannot replicate');
    }

    try {
      message.recipients = subscription.getRecipients(message);
      publisher.processPublish(message, function (error) {
        if (error) return emitError(error, 'error doing processPublish, cannot replicate');
      });
    } catch (error) {
      return emitError(error, 'error doing getRecipients, cannot replicate');
    }
  };
};

Member.prototype.connect = function (member) {
  var _this = this;

  var config = _this.orchestrator.getLoginConfig();

  _this.log.debug('connect to (->) %s', member.url);
  _this.log.debug('as %s', _this.name);

  config.url = member.url;

  if (!config.connectTimeout) config.connectTimeout = 5000; //connection timeout, before we forget about the peers existence

  _this.HappnClient.create(config, function (error, client) {
    if (error) {
      let thisError = error.error ? error.error : error;

      if (
        thisError.code === 'ECONNREFUSED' ||
        thisError.toString() === 'Error: connection timed out' ||
        thisError.message.indexOf('connect ECONNREFUSED') === 0
      ) {
        // This happens when we join, get list of remotes and simultaneously
        // one of them shuts down. We don't get the notification from swim
        // in time to know not to login.
        //
        // And we don't want to fail starting this node because another shut down
        // at the same time as we joined.
        _this.log.warn('FAILED connection to departed %s', config.url);
        _this.orchestrator.removeMember(_this);
        return;
      }

      // ignore second error after ECONNREFUSED
      // https://github.com/happner/happn/issues/138
      if (!_this.orchestrator.members[_this.memberId]) return;

      _this.error = thisError;
      _this.log.fatal('could not login to %s', config.url, thisError);
      _this.orchestrator.__stateUpdate();
      return;
    }

    _this.connectedTo = true;
    // _this.connectingTo = false;

    getter(_this, 'client', client);

    _this.name = client.serverInfo.name;

    property(
      _this,
      '__disconnectServerSide',
      client.onEvent('server-side-disconnect', _this.__onHappnDisconnect.bind(_this))
    );

    property(
      _this,
      '__disconnectSubscriptionId',
      client.onEvent('connection-ended', _this.__onHappnDisconnect.bind(_this))
    );

    property( 
      _this,
      '__retryConnectSubscriptionId',
      client.onEvent('reconnect-scheduled', _this.__onHappnDisconnect.bind(_this))
    );

    property(
      _this,
      '__reconnectSubscriptionId',
      client.onEvent('reconnect-successful', _this.__onHappnReconnect.bind(_this))
    );

    _this.__subscribeToReplicate();
  });

  Member.prototype.__subscribeToReplicate = async function () {
    for (let replicatePath of this.orchestrator.config.replicate) {
      try {
        await this.__subscribe(replicatePath);
      } catch (e) {
        this.error = e;
        this.orchestrator.__stateUpdate();
        return;
      }
    }
    this.subscribedTo = true;
    this.orchestrator.__stateUpdate();
  };
};
