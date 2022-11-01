class Component0 {
  async method() {
    return 1;
  }
  async naught() {}
}
module.exports = {
  modules: {
    component0: {
      instance: new Component0(),
    },
  },
  components: {
    component0: {},
  },
};
