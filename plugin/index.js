const { smartHub } = require('../models');
require('../bin/www');

let Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
  console.log("homebridge API version: " + homebridge.version);

  // Accessory must be created from PlatformAccessory Constructor
  Accessory = homebridge.platformAccessory;

  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  // For platform plugin to be considered as dynamic platform plugin,
  // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
  homebridge.registerPlatform("homebridge-mysmarthub", smartHub.name, SmartHubPlatform, true);
};

// Platform constructor
// config may be null
// api may be null if launched from old homebridge version
class SmartHubPlatform {
  constructor(log, config, api) {
    log('SmartHub platform Init');

    this.log = log;
    this.config = config;
    this.devices = [];

    if (api) {
      this.api = api;

      this.api.on('didFinishLaunching', () => {
        this.log('DidFinishLaunching');

        smartHub.registerDevices().then(devices => devices.map(device => this.addDevice(device)));
      });
    }
  }

  addDevice(device) {
    this.log('Adding device ' + device.name);

    switch(device.model) {
      case 'smartThermometer':
        const temperatureSensor = this.getTemperatureSensor(device);
        const humiditySensor = this.getHumiditySensor(device);
        const uuid = UUIDGen.generate(device.uid);
        const smartThermometer = new Accessory(device.model, uuid);

        smartThermometer.addService(temperatureSensor, 'Smart thermometer');
        smartThermometer.addService(humiditySensor, 'Smart humidity meter');

        smartThermometer.on('identify', (paired, callback) => {

          this.log(smartThermometer.name, "Identify!!!", paired);

          callback();
        });

        this.devices.push(smartThermometer);
        this.api.registerPlatformAccessories("homebridge-mysmarthub", smartHub.name, [smartThermometer]);
        break;
      default:
        this.log('mne len bilo opisivat drugie ustroystva', device.name);
    }
  }

  getTemperatureSensor(device) {
    const temperatureSensor = new Service.TemperatureSensor('Smart thermometer');

    temperatureSensor
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', callback => {
        if (!device.connected) {
          return callback(null, device.data.temperature);
        }

        device.getData()
          .then(data => callback(null, data.temperature))
          .catch(err => callback(err));
      });

    temperatureSensor
      .getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({ minValue: device.minValue });

    temperatureSensor
      .getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({ maxValue: device.maxValue });

    return temperatureSensor;
  }

  getHumiditySensor(device) {
    const humiditySensor = new Service.HumiditySensor('Smart humidity meter');

    humiditySensor
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', callback => {
        if (!device.connected) {
          return callback(null, device.data.humidity);
        }

        device.getData()
          .then(data => callback(null, data.humidity))
          .catch(err => callback(err));
      });

    return humiditySensor;
  }

  configurationRequestHandler(context, request, callback) {
    this.log('configurationRequestHandler', context, request);

    callback();
  }

  configureAccessory(accessory) {
    this.log('configureAccessory is not implemented yet')
  }

  // Sample function to show how developer can remove accessory dynamically from outside event
  removeAccessory() {
    this.log("Remove Accessory");
    this.api.unregisterPlatformAccessories("homebridge-mysmarthub", smartHub.name, this.devices);

    this.devices = [];
  }
}