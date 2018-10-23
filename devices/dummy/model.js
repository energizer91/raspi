const SmartDevice = require('../../models/smartDevice');
const capabilities = require('../../helpers/capabilities');

class DummyDevice extends SmartDevice {
  constructor(config, api) {
    super(config, api);

    this.name = 'Dummy device';
    this.capabilities = [capabilities.DUMMY];

    this.timerId = null;
  }

  deviceDidConnect() {
    this.timerId = setInterval(() => {
      this.getData();
    }, 1000);
  }

  deviceWillDisconnect() {
    clearInterval(this.timerId);
  }
}

module.exports = DummyDevice;
