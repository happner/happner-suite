class Component2 {
  async method($happn) {
    const result1 = await $happn.exchange.component0.method();
    const result2 = await $happn.exchange.component1.method();
    return result1 + result2;
  }
  async two() {}
}

module.exports = {
  modules: {
    component2: {
      instance: new Component2(),
    },
  },
  components: {
    component2: {},
  },
};
