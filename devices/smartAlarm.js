const SmartDevice = require('../models/smartDevice');
const capabilities = require('../helpers/capabilities');

class SmartThermometer extends SmartDevice {
  constructor(uid, api, data, config, vid, pid, sno) {
    super(uid, api);

    this.sno = sno;
    this.model = 'smartAlarm';
    this.name = 'Smart alarm';
    this.capabilities = [capabilities.DUMMY];
    this.data = data;
  }

  createAccessory(Accessory, Service, Characteristic) {
    this.alarm = new Accessory(this.model, this.uid);

    this.alarm
      .getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, this.smartHub.manufacturer)
      .setCharacteristic(Characteristic.Model, this.name)
      .setCharacteristic(Characteristic.SerialNumber, this.sno);

    this.lightSensor = new Service.LightSensor('Light');

    this.alarm.addService(this.lightSensor);

    this.attachLightData(this.lightSensor, Characteristic);
    this.attachUpdate(this.lightSensor, Characteristic);

    return this.alarm;
  }

  attachLightData(sensor, Characteristic) {
    if (!sensor) {
      return;
    }

    sensor
      .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
      .on('get', callback => {
        console.log('Getting light level');
        this.getData()
          .then(data => callback(null, data.lightLevel))
          .catch(err => callback(err));
      });
  }

  notifyChanges(sensor, Characteristic) {
    if (!sensor || !this.connected) {
      return;
    }

    this.getData()
      .then(data => {
        sensor
          .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
          .updateValue(data.lightLevel);
      })
      .catch(error => console.error('Unable to update value', error));
  }

  attachUpdate(sensor, Characteristic) {
    setInterval(() => this.notifyChanges(sensor, Characteristic), 5000)
  }

  attachServiceCharacteristics(accessory, Service, Characteristic) {
    if (!accessory) {
      return;
    }

    if (!this.lightSensor) {
      this.lightSensor = accessory.getService('Light');
    }
    this.attachLightData(this.lightSensor, Characteristic);
    this.attachUpdate(this.lightSensor, Characteristic);
  }
}

module.exports = SmartThermometer;
