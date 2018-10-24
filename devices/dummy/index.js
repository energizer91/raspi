const SmartDevice = require('../../models/smartDevice');
const capabilities = require('../../helpers/capabilities');

class DummyDevice extends SmartDevice {
  constructor(uid, api, data) {
    super(uid, api);

    this.name = 'Smart bulb';
    this.capabilities = [capabilities.DUMMY];
    this.data = data;
  }
}

module.exports = DummyDevice;
