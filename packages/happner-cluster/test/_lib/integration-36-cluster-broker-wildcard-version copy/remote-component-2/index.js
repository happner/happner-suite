module.exports = Component;

class Component {
  constructor() {
    this.version = '3.4.5';
  }
  start($happn, callback) {
    callback();
  }

  stop($happn, callback) {
    callback();
  }

  getVersion($happn, callback) {
    callback(null, {
      mesh: $happn.info.mesh.name,
      version: this.version,
      component: 'remoteComponent1',
    });
  }
}
