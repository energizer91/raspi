const SmartHub = require('../models/smartHub');
const app = require('../bin/www');
const hubRouter = require('../routes/hub');
const client = require('prom-client');
const mqtt = require('mqtt');
const globalConfig = require('config');

module.exports = function(homebridge) {
  // Platform constructor
  // config may be null
  // api may be null if launched from old homebridge version
  class SmartHubPlatform {
    constructor(log, config, api) {
      log('SmartHub platform Init');

      const register = new client.Registry();
      const mqttClient = mqtt.connect(globalConfig.get('mqtt.url'));

      // Add a default label which is added to all metrics
      register.setDefaultLabels({app: "raspi"});

      // Enable the collection of default metrics
      client.collectDefaultMetrics({ register });

      this.log = log;
      this.config = config;
      this.hub = new SmartHub(homebridge, register, mqttClient, log); // link homebridge to smarthub

      const hubMiddleware = (req, res, next) => {
        req.smartHub = this.hub;
        req.register = register;
        req.mqtt = mqttClient;
        req.log = this.log;

        return next();
      };

      app.use('/hub', hubMiddleware, hubRouter);

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

      if (!device.homekit) {
        // no need to register device in homekit
        return;
      }

      const accessory = device.createAccessory();

      if (!accessory) {
        return;
      }

      accessory.on('identify', (paired, callback) => device.identify(paired).then(callback));

      this.registerAccessories([accessory]);
    }

    registerAccessories(accessories) {
      this.api.registerPlatformAccessories(SmartHubPlatform.package, SmartHubPlatform.package, accessories);
    }

    unregisterAccessories(accessories) {
      this.api.unregisterPlatformAccessories(SmartHubPlatform.package, SmartHubPlatform.package, accessories);
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

          if (!device.homekit) {
            // no need to send reachability to homekit
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

  SmartHubPlatform.package = globalConfig.get('plugin.package'); // package name for homebridge
  SmartHubPlatform.friendlyName = globalConfig.get('plugin.friendlyName'); // friendly name of hub

  return SmartHubPlatform;
};
