const SmartDevice = require('../models/smartDevice');

class SmartThermometer extends SmartDevice {
  constructor(uid, smartHub, config) {
    super(uid, smartHub, config);

    this.model = 'smartThermometer';
    this.name = 'Smart thermometer';
    this.data = Object.assign({
      temperature: 0,
      humidity: 0
    }, config.data);

    this.services = [
      {
        name: 'Temperature',
        type: this.homebridge.hap.Service.TemperatureSensor,
        characteristics: [
          {
            type: this.homebridge.hap.Characteristic.CurrentTemperature,
            get: data => data.temperature,
            props: {
              minValue: -40,
              maxValue: 80
            }
          }
        ]
      },
      {
        name: 'Humidity',
        type: this.homebridge.hap.Service.HumiditySensor,
        characteristics: [
          {
            type: this.homebridge.hap.Characteristic.CurrentRelativeHumidity,
            get: data => data.humidity
          }
        ],
      }
    ];
  }
}

module.exports = SmartThermometer;
