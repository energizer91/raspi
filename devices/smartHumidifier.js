const SmartDevice = require('../models/smartDevice');

class SmartHumidifier extends SmartDevice {
  constructor(uid, smartHub, config) {
    super(uid, smartHub, config);

    this.model = 'smartHumidifier';
    this.name = 'Smart humidifier';
    this.data = Object.assign({
      hue: 0,
      saturation: 0,
      value: 0,
      fanSpeed: 0,
      changeFilter: 0,
      lowWaterLevel: false,
      doorOpen: false
    }, config.data);

    this.services = [
      {
        name: 'Fan',
        type: this.homebridge.hap.Service.Fan,
        characteristics: [
          {
            type: this.homebridge.hap.Characteristic.RotationSpeed,
            get: data => data.fanSpeed,
            set: value => ({ fanSpeed: value })
          }
        ],
      },
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

module.exports = SmartHumidifier;
