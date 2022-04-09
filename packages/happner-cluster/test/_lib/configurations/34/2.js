class Component2 {
  async method($happn) {
    const result1 = await $happn.exchange.$call({
      component: 'component0',
      method: 'method',
    });
    const result2 = await $happn.exchange.component1.method();
    return { sum: result1 + result2.number, name: result2.name, callCount: result2.callCount };
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
