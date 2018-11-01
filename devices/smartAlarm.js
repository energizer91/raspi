const SmartDevice = require('../models/smartDevice');

class SmartThermometer extends SmartDevice {
  constructor(uid, smartHub, config) {
    super(uid, smartHub, config);

    this.model = 'smartAlarm';
    this.name = 'Smart alarm';
    this.data = Object.assign({
      lightLevel: 0
    }, config.data);

    this.services = [
      {
        name: 'Light',
        type: this.homebridge.hap.Service.LightSensor,
        characteristics: [
          {
            type: this.homebridge.hap.Characteristic.CurrentAmbientLightLevel,
            get: data => data.lightLevel
          }
        ],
      }
    ]
  }
}

module.exports = SmartThermometer;
