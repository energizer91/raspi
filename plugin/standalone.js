const SmartHubPlatform = require('./platform')();
const EventEmitter = require('events');

class API extends EventEmitter {
  constructor() {
    super();

    this.emit('didFinishLoading');
  }
  registerPlatformAccessories(...args) {
    console.log('registerPlatformAccessories', ...args)
  }
  unregisterPlatformAccessories(...args) {
    console.log('unregisterPlatformAccessories', ...args)
  }
}

const api = new API();

const log = (...args) => console.log('Homebridge log', ...args);

new SmartHubPlatform(log, {}, api);