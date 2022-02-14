const util = require('util');
const HttpConnector = require('elasticsearch/src/lib/connectors/http');
const customHttpAgent = require('agentkeepalive');

function CustomESHTTPConnector(host, config) {
  HttpConnector.call(this, host, config);
}

util.inherits(CustomESHTTPConnector, HttpConnector);

CustomESHTTPConnector.prototype.createAgent = function (config) {
  return new customHttpAgent(this.makeAgentConfig(config));
};

module.exports = CustomESHTTPConnector;
