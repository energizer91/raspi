const SmartDevice = require('../models/smartDevice');

class SmartThermometer extends SmartDevice {
  constructor(uid, api, data, config, sno) {
    super(uid, api);

    this.sno = sno;
    this.model = 'smartAlarm';
    this.name = 'Smart alarm';
    this.data = data;

    this.services = [
      {
        name: 'Light',
        type: this.homebridge.Service.LightSensor,
        characteristic: this.homebridge.Characteristic.CurrentAmbientLightLevel,
        get: data => data.lightLevel
      }
    ]
  }
}

module.exports = SmartThermometer;
