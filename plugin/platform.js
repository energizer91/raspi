const SmartHub = require('../models/smartHub');
const app = require('../bin/www');
const hubRouter = require('../routes/hub');

module.exports = function(homebridge) {
  // Platform constructor
  // config may be null
  // api may be null if launched from old homebridge version
  class SmartHubPlatform {
    constructor(log, config, api) {
      log('SmartHub platform Init');

      this.log = log;
      this.config = config;
      this.hub = new SmartHub(homebridge); // link homebridge to smarthub

      app.use('/hub', (req, res, next) => {
        req.smartHub = this.hub;

        return next();
      }, hubRouter);

      if (api) {
        this.api = api;

        this.api.on('didFinishLaunching', () => {
          this.hub.on('newDevice', device => this.addDevice(device));
          this.hub.on('removeDevice', device => this.removeDevice(device));
        });
      }
    }

    addDevice(device) {
      this.log('Adding device ' + device.name);

      const accessory = device.createAccessory();

      if (!accessory) {
        return;
      }

      accessory.on('identify', (paired, callback) => device.identify(paired).then(callback));

      this.registerAccessories([accessory]);
    }

    registerAccessories(accessories) {
      this.api.registerPlatformAccessories(SmartHubPlatform.package, SmartHubPlatform.name, accessories);
    }

    unregisterAccessories(accessories) {
      this.api.unregisterPlatformAccessories(SmartHubPlatform.package, SmartHubPlatform.name, accessories);
    }

    // Function invoked when homebridge tries to restore cached accessory.
    // Developer can configure accessory at here (like setup event handler).
    // Update current value.
    configureAccessory(accessory) {
      this.log('Configuring accessory', accessory.displayName);

      this.hub.getDevice(accessory.UUID)
        .then(device => {
          if (!device) {
            return;
          }

          this.log('Set reachability for', accessory.displayName, device.connected);
          accessory.reachable = device.connected;

          accessory.on('identify', (paired, callback) => device.identify(paired).then(callback));

          device.on('connected', () => {
            this.log(accessory.displayName, 'has been connected to network');

            accessory.updateReachability(true);
          });

          device.on('disconnected', () => {
            this.log(accessory.displayName, 'has been disconnected to network');

            accessory.updateReachability(false);
          });

          device.attachServiceCharacteristics(accessory);

          this.log(accessory.displayName, 'has been configured');
        })
        .catch(error => this.log('Device configuration error', error));
    }

    configurationRequestHandler(context, request, callback) {
      this.log('configurationRequestHandler', context, request);

      callback();
    }

    // Sample function to show how developer can remove accessory dynamically from outside event
    removeDevice(device) {
      this.log("Remove Accessory");

      const accessory = device.accessory;

      if (!accessory) {
        return;
      }

      this.unregisterAccessories([accessory]);
    }
  }

  SmartHubPlatform.package = "homebridge-mysmarthub"; // package name for homebridge
  SmartHubPlatform.name = 'energizer91\'s Smart hub'; // friendly name of hub

  return SmartHubPlatform;
};
