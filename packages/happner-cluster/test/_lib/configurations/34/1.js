class Component1 {
  constructor() {
    this.callCount = 0;
  }
  async method($happn) {
    this.callCount++;
    return { name: $happn.info.mesh.name, number: 2, callCount: this.callCount };
  }
  async one() {}
}
module.exports = {
  modules: {
    component1: {
      accessLevel: 'mesh',
      instance: new Component1(),
    },
  },
  components: {
    component1: {},
  },
};
