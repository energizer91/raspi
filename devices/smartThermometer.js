const SmartDevice = require('../models/smartDevice');
const client = require('prom-client');

class SmartThermometer extends SmartDevice {
  constructor(uid, smartHub, config) {
    super(uid, smartHub, config);

    this.model = 'smartThermometer';
    this.name = 'Smart thermometer';
    this.data = Object.assign({
      temperature: 0,
      humidity: 0
    }, config.data);
  }

  getServices() {
    return [
      {
        name: 'Temperature',
        type: this.homebridge.hap.Service.TemperatureSensor,
        characteristics: [
          {
            type: this.homebridge.hap.Characteristic.CurrentTemperature,
            metric: {
              type: client.Gauge,
              name: this.model + '_temperature',
              help: 'Current temperature'
            },
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
            metric: {
              type: client.Gauge,
              name: this.model + '_humidity',
              help: 'Current relative humidity'
            },
            get: data => data.humidity
          }
        ]
      }
    ];
  }
}

module.exports = SmartThermometer;
