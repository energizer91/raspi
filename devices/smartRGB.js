const SmartDevice = require('../models/smartDevice');

class DummyDevice extends SmartDevice {
  constructor(uid, smartHub, config) {
    super(uid, smartHub, config);

    this.model = 'smartRGB';
    this.name = 'Smart RGB';
    this.data = Object.assign({
      hue: 0,
      saturation: 0,
      value: 0,
      enabled: false
    }, config.data);

    this.services = [
      {
        name: 'LightBulb',
        type: this.homebridge.hap.Service.Lightbulb,
        characteristics: [
          {
            type: this.homebridge.hap.Characteristic.Hue,
            get: data => data.hue,
            set: value => ({ hue: value })
          },
          {
            type: this.homebridge.hap.Characteristic.Saturation,
            get: data => data.saturation,
            set: value => ({ saturation: value })
          },
          {
            type: this.homebridge.hap.Characteristic.Brightness,
            get: data => data.value,
            set: value => ({ value: value })
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

module.exports = DummyDevice;
