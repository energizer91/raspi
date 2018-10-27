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
    this.interval = null;
  }

  deviceDidConnect() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => this.notifyChanges(), 5000)
  }

  deviceWillDisconnect() {
    clearInterval(this.interval);
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

  notifyChanges() {
    if (!this.lightSensor || !this.connected || !this.Characteristic) {
      return;
    }

    this.getData()
      .then(data => {
        this.lightSensor
          .getCharacteristic(this.Characteristic.CurrentAmbientLightLevel)
          .sendValue(data.lightLevel);
      })
      .catch(error => console.error('Unable to update value', error));
  }

  attachServiceCharacteristics(accessory, Service, Characteristic) {
    if (!accessory) {
      return;
    }

    if (!this.lightSensor) {
      this.lightSensor = accessory.getService('Light');
    }
    this.Characteristic = Characteristic;
    this.attachLightData(this.lightSensor, Characteristic);
  }
}

module.exports = SmartThermometer;
