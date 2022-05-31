module.exports = class Component {
  constructor() {}

  async start($happn) {
    this.receivedEvents = [];
    this.eventHandle = await $happn.event.testComponent.on('YO', (data) => {
      console.log('RECIEVED EVENT at ', $happn.info.mesh.name, { data });
      this.receivedEvents.push(data.value);
    });
  }

  async stop() {
    // await $happn.event.testComponent.off(this.eventHandle);
  }
  async fireEvent($happn) {
    let eventId = Date.now();
    let data = $happn.info.mesh.name + ':TestComponent:event:' + eventId;
    $happn.emit('YO', data);
    console.log('FIRED AT ', $happn.info.mesh.name);
  }
  async getEvents() {
    return this.receivedEvents;
  }
  async clearEvents($happn) {
    this.receivedEvents = [];
    // console.log('CLEARED AT ', $happn.info.mesh.name);
  }
  async getKeys($happn) {
    // console.log(Object.keys($happn.info))
    // let data = $happn.info.mesh.name + ':TestComponent:event';
    return Object.keys($happn.exchange.services);
  }
  block($happn, delay, callback) {
    setTimeout(() => {
      const target = Date.now() + delay;
      while (Date.now() <= target) {}
    }, 100);
    callback(null, $happn.info.mesh.name + ':brokerComponent:block');
  }
};
