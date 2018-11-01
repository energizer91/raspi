const SmartDevice = require('../models/smartDevice');

class SmartBulb extends SmartDevice {
  constructor(uid, smartHub, config) {
    super(uid, smartHub, config);

    this.model = 'smartBulb';
    this.name = 'Smart bulb';
    this.data = Object.assign({
      enabled: false,
      brightness: 0
    }, config.data);

    this.services = [
      {
        name: 'LightBulb',
        type: this.homebridge.hap.Service.Lightbulb,
        characteristics: [
          {
            type: this.homebridge.hap.Characteristic.Brightness,
            get: data => data.brightness,
            set: value => ({ brightness: value })
          },
          {
            type: this.homebridge.hap.Characteristic.On,
            get: data => data.enabled,
            set: value => ({ enabled: value })
          }
        ]
      }
    ];
  }
}

module.exports = SmartBulb;
