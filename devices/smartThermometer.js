const SmartDevice = require('../models/smartDevice');

class SmartThermometer extends SmartDevice {
  constructor(uid, smartHub, data, config, sno) {
    super(uid, smartHub, sno);

    this.sno = sno;
    this.model = 'smartThermometer';
    this.name = 'Smart thermometer';
    this.data = data;

    this.services = [
      {
        name: 'Temperature',
        type: this.homebridge.hap.Service.TemperatureSensor,
        characteristic: this.homebridge.hap.Characteristic.CurrentTemperature,
        props: {
          minValue: -40,
          maxValue: 80
        },
        get: data => data.temperature,
        set: value => ({ temperature: value })
      },
      {
        name: 'Humidity',
        type: this.homebridge.hap.Service.HumiditySensor,
        characteristic: this.homebridge.hap.Characteristic.CurrentRelativeHumidity,
        get: data => data.humidity,
        set: value => ({ humidity: value })
      }
    ];
  }
}

module.exports = SmartThermometer;
