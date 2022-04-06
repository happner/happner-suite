module.exports = Component;

class Component {
  constructor() {
    this.version = '2.1.2';
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
