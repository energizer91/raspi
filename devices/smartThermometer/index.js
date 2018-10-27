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

  createAccessory(Accessory, Service, Characteristic) {
    this.thermometer = new Accessory(this.model, this.uid);

    this.createServices(Service);

    this.thermometer.addService(this.temperatureSensor);
    this.thermometer.addService(this.humiditySensor);

    this.attachTemperatureData(this.temperatureSensor, Characteristic);
    this.attachHumidityData(this.humiditySensor, Characteristic);

    return this.thermometer;
  }

  createServices(Service) {
    this.temperatureSensor = new Service.TemperatureSensor('Temperature');
    this.humiditySensor = new Service.HumiditySensor('Humidity');
  }

  attachTemperatureData(sensor, Characteristic) {
    if (!sensor) {
      return;
    }

    sensor
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', callback => {
        console.log('Getting temperature');
        this.getData()
          .then(data => callback(null, data.temperature))
          .catch(err => callback(err));
      });

    sensor
      .getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({ minValue: this.minValue });

    sensor
      .getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({ maxValue: this.maxValue });
  }

  attachHumidityData(sensor, Characteristic) {
    if (!sensor) {
      return;
    }

    sensor
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', callback => {
        console.log('Getting humidity');
        this.getData()
          .then(data => callback(null, data.humidity))
          .catch(err => callback(err));
      });
  }

  attachServiceCharacteristics(accessory, Service, Characteristic) {
    if (!accessory) {
      return;
    }

    if (!this.thermometer && !this.humiditySensor) {
      this.createServices(Service);
    }

    console.log('Trying to attach service data', this.temperatureSensor, accessory.getService(this.temperatureSensor));

    this.attachTemperatureData(accessory.getService(this.temperatureSensor), Characteristic);
    this.attachHumidityData(accessory.getService(this.humiditySensor), Characteristic);
  }
}

module.exports = SmartThermometer;
