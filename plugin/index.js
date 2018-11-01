const { SmartHub } = require('../models');
const app = require('../bin/www');

const hubRouter = require('../routes/hub');

let smartHub;

const smartHubMiddleware = (req, res, next) => {
  req.smartHub = smartHub;

  return next();
};

module.exports = function(homebridge) {
  // link homebridge to smarthub
  smartHub = new SmartHub(homebridge);

  app.use(smartHubMiddleware);
  app.use('/hub', hubRouter);

  console.log("homebridge API version: " + homebridge.version);

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
    this.package = "homebridge-mysmarthub";

    if (api) {
      this.api = api;

      this.api.on('didFinishLaunching', () => {
        smartHub.on('newDevice', device => this.addDevice(device));
        smartHub.on('removeDevice', device => this.removeDevice(device));
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
    this.api.registerPlatformAccessories(this.package, smartHub.name, accessories);
  }

  unregisterAccessories(accessories) {
    this.api.unregisterPlatformAccessories(this.package, smartHub.name, accessories);
  }

  // Function invoked when homebridge tries to restore cached accessory.
  // Developer can configure accessory at here (like setup event handler).
  // Update current value.
  configureAccessory(accessory) {
    this.log('Configuring accessory', accessory.displayName);

    smartHub.getDevice(accessory.UUID)
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
