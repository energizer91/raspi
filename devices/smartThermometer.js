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
            get: data => data.temperature
          }
        ],
      }
    ];
  }
}

module.exports = SmartThermometer;
