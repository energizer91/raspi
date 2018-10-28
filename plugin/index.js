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
    this.package = "homebridge-mysmarthub";

    if (api) {
      this.api = api;

      this.api.on('didFinishLaunching', () => {
        this.log('DidFinishLaunching');

        smartHub.on('newDevice', device => this.addDevice(device));
      });
    }
  }

  addDevice(device) {
    this.log('Adding device ' + device.name);

    const accessory = device.createAccessory(Accessory, Service, Characteristic);

    if (!accessory) {
      return;
    }

    this.devices.push(accessory);
    this.registerAccessories([accessory]);
  }

  registerAccessories(accessories) {
    this.api.registerPlatformAccessories(this.package, smartHub.name, accessories);
  }

  unregisterAccessories(accessories) {
    this.api.registerPlatformAccessories(this.package, smartHub.name, accessories);
  }

  configureAccessory(accessory) {
    this.log('Configuring accessory', accessory.displayName);

    const device = smartHub.getDevice(accessory.UUID);

    if (!device) {
      return;
    }

    this.log('Set reachability for', accessory.displayName, device.connected);
    accessory.reachable = device.connected;

    device.on('connected', () => {
      this.log(accessory.displayName, 'has been connected to network');

      accessory.updateReachability(true);
    });

    device.on('disconnected', () => {
      this.log(accessory.displayName, 'has been disconnected to network');

      accessory.updateReachability(false);
    });

    device.attachServiceCharacteristics(accessory, Service, Characteristic);

    this.devices.push(accessory);
    this.log(accessory.displayName, 'has been configured');
  }

  configurationRequestHandler(context, request, callback) {
    this.log('configurationRequestHandler', context, request);

    callback();
  }

  // Sample function to show how developer can remove accessory dynamically from outside event
  removeAccessory() {
    this.log("Remove Accessory");
    this.unregisterAccessories(this.devices);

    this.devices = [];
  }
}