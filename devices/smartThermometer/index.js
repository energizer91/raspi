const SmartDevice = require('../../models/smartDevice');
const capabilities = require('../../helpers/capabilities');

class SmartThermometer extends SmartDevice {
  constructor(uid, api, data) {
    super(uid, api);

    this.model = 'smartThermometer';
    this.name = 'Smart thermometer';
    this.capabilities = [capabilities.DUMMY];
    this.minValue = -40;
    this.maxValue = 80;
    this.data = data;
  }

  attachServiceCharacteristics(service) {
    if (!service) {
      return;
    }


  }
}

module.exports = SmartThermometer;
