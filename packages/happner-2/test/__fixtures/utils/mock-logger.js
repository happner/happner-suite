module.exports = class MockLogger {
  static create() {
    return require('happn-commons-test').create().sinon.createStubInstance(MockLogger);
  }
  info() {}
  debug() {}
  error() {}
  warn() {}
  trace() {}
};
