//index.js
module.exports = class Watch {
  constructor() {}

  async start($happn) {}

  async getHumanTime($happn) {
    let time;
    try {
      time = await $happn.exchange['timer'].getSystemTime();
      // Call to remote component.
      // These will always return promises or call callback functions.
    } catch (e) {
      //It is advised to put any remote calls in a try/catch, as the
      //remote component or method may be unavailable, or it's mesh may be
      //down, and this can be handled
      throw e; //But for the purposes of this example, we will just throw.
    }
    let humanTime = new Date(time).toLocaleTimeString();
    return humanTime;
  }
};
