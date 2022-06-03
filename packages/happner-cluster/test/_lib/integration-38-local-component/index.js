module.exports = class Component {
  constructor() {}

  async start($happn) {
    this.receivedEvents = [];
    this.eventHandle = await $happn.event.testComponent.on('YO', (data) => {
      this.receivedEvents.push(data.value);
    });
  }

  async stop() {
    await $happn.event.testComponent.off(this.eventHandle);
    await $happn.event.testComponent.off(this.eventHandle2);
  }
  async subscribeSecondEvent($happn) {
    this.eventHandle2 = await $happn.event.testComponent.on('SECOND', (data) => {
      this.receivedEvents.push(data.value);
    });
  }
  async offSecondEvent($happn) {
    await $happn.event.testComponent.off(this.eventHandle2);
  }
  async fireSecondEvent($happn) {
    let eventId = Date.now();
    let data = $happn.info.mesh.name + ':TestComponent:event:second:' + eventId;
    $happn.emit('SECOND', data);
  }
  async fireEvent($happn) {
    let eventId = Date.now();
    let data = $happn.info.mesh.name + ':TestComponent:event:' + eventId;
    $happn.emit('YO', data);
  }
  async getEvents() {
    return this.receivedEvents;
  }
  async clearEvents() {
    this.receivedEvents = [];
  }

  block($happn, delay, callback) {
    setTimeout(() => {
      const target = Date.now() + delay;
      while (Date.now() <= target) {}
    }, 100);
    callback(null, $happn.info.mesh.name + ':brokerComponent:block');
  }
};
