const Helper = require('./helper');
const HappnerCluster = require('../../..');
module.exports = class Cluster extends Helper {
  constructor() {
    super();
    this.instances = [];
    this.events = {
      data: [],
    };
    this.member = {
      start: async (configuration, wait) => {
        // before you think you can tidy this up, we need to use the callback, otherwise the we cannot move on to start other test peers
        HappnerCluster.create(configuration, (e, instance) => {
          if (e) {
            // eslint-disable-next-line no-console
            console.warn('ERROR STARTING TEST INSTANCE: ' + e.message);
          }
          this.events.data.push({
            key: 'member-started',
            value: instance._mesh.config.name,
          });
          this.instances.push(instance);
        });
        await this.delay(wait);
      },
    };
    this.component = {
      inject: (index, configuration) => {
        this.instances.sort((a, b) => {
          if (a._mesh.config.name < b._mesh.config.name) return -1;
          return 1;
        });
        const instances = this.instances;
        return new Promise((resolve, reject) => {
          instances[index]._mesh._createElement(configuration, true, (e) => {
            if (e) return reject(e);
            resolve();
          });
        });
      },
    };
  }
  static create() {
    return new Cluster();
  }
  sort() {
    this.instances.sort((a, b) => {
      if (a._mesh.config.name < b._mesh.config.name) return -1;
      return 1;
    });
  }
  async destroy(index) {
    if (index >= 0) {
      await this.instances[index].stop();
      this.instances.splice(index, 1);
      return;
    }
    this.instances.sort((a, b) => {
      if (a._mesh.config.name < b._mesh.config.name) return -1;
      return 1;
    });
    for (let instance of this.instances) {
      if (instance.stop) {
        await instance.stop();
      }
    }
  }
};
