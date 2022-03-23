class Component1 {
  async method() {
    return 2;
  }
  async one() {}
}
module.exports = {
  modules: {
    component1: {
      instance: new Component1(),
    },
  },
  components: {
    component1: {},
  },
};
