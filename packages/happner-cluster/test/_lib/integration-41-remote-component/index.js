module.exports = class Component {
  constructor() {
    this.id = Date.now().toString().slice(-5);
  }

  async start() {}

  async stop() {}
  setData($happn, index, callback) {
    let dataPath = `data/busy/${this.id}/${index}`;
    // $happn.data.set(dataPath, { index }, () => {
    setTimeout(() => callback(null, dataPath), 2000);
    // });
  }
  async block($happn) {
    setTimeout(() => {
      const target = Date.now() + 10000;
      // eslint-disable-next-line no-empty
      while (Date.now() <= target) {}
    }, 100);
    return $happn.info.mesh.name + ':busyComponent:block';
  }
};
