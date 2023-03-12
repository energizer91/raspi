const API = require('./api');
const WebSocket = require('ws');
const deviceModels = require('../devices');
const EventEmitter = require('events');
const config = require('config');

function heartbeat() {
  this.isAlive = true;
}

function noop() {
}

class SmartHub extends EventEmitter {
  constructor(homebridge, prometheusRegister, mqttClient, log) {
    super();

    this.api = new API();
    this.devices = new Map();
    this.zigbeeDevices = new Map(); // deviceId -> uid, which means this device is registered (in order to do less work while getting every possible message)
    this.manufacturer = config.get('smarthub.manufacturer');
    this.homebridge = homebridge;
    this.prometheusRegister = prometheusRegister;
    this.mqttClient = mqttClient;
    this.log = log;

    this.wss = new WebSocket.Server(config.get('connection'));

    this.mqttClient.on('connect', () => {
      this.mqttClient.subscribe(config.get('mqtt.prefix') + '/+', (err) => {
        if (err) {
          this.log.error('Subscription error', err);
        }
      });

      this.mqttClient.on('message', (topic) => {
        const topicArray = topic.split('/');

        if (!topicArray[0] !== config.get('mqtt.prefix')) {
          // not zigbee2mqtt topic, don't listen to it
          return;
        }

        const sno = topicArray[1];

        if (!sno) {
          // unknown topic
          return;
        }

        if (!this.zigbeeDevices.get(sno)) {
          // we don't care about this device
        }

        this.connectMqttDevice(topic, {sno}).catch(error => {
            this.log.error('Error connecting device', error);
          }
        );
      });
    });

    this.wss.on('connection', (ws, req) => {
      const {sno} = req.headers;

      ws.on('pong', heartbeat);

      this.connectDevice(ws, {sno})
        .catch(error => {
            this.log.error('Error connecting device', error);
            ws.close();
          }
        );
    })

    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (ws.isAlive === false) {
          this.log("Terminating client");
          ws.terminate();
          return;
        }

        ws.isAlive = false;
        ws.ping(noop);
      });
    }, 30000);

    this.wss.on('close', function close() {
      clearInterval(this.pingInterval);
    });
  }

  getAllRegisteredDevices() {
    this.api.getAllDevices()
      .then(devices => {
        devices.forEach(device => {
          // initial adding all possible zigbee devices to database
          this.zigbeeDevices.set(device.sno, device.uid);
        })
      })
  }

  registerDevice(dbDevice) {
    if (!dbDevice.active) {
      return null;
    }

    if (!deviceModels[dbDevice.model]) {
      throw new Error('Device model not found');
    }

    const Device = deviceModels[dbDevice.model];

    const device = new Device(dbDevice.uid, {
      getRegisteredDevices: () => this.getRegisteredDevices(),
      getDevice: uid => this.getDeviceInstance(uid),
      emit: (event, ...args) => this.emit(event, ...args),
      homebridge: this.homebridge,
      manufacturer: this.manufacturer,
      register: this.prometheusRegister,
      mqttClient: this.mqttClient,
      log: this.log,
    }, dbDevice);

    device.load();

    this.devices.set(dbDevice.uid, device);

    return device;
  }

  unregisterDevice(uid) {
    const device = this.getDeviceInstance(uid);

    if (!device) {
      return;
    }

    if (device.connected) {
      device.disconnect("unregister");
    }

    device.unload();
  }

  getApi() {
    return this.api;
  }

  getRegisteredDevices() {
    return this.devices;
  }

  async getDevice(uid) {
    if (this.devices.has(uid)) {
      return this.devices.get(uid);
    }

    const device = await this.api.getDevice(uid);

    return this.registerDevice(device);
  }

  async connectMqttDevice(topic, {sno}) {
    if (topic) {
      throw new Error('No topic specified');
    }

    const device = await this.api.getDeviceByVendorData(sno);

    if (!device) {
      throw new Error('No device found');
    }

    const instance = await this.getDevice(device.uid);

    if (instance) {
      if (!instance.connected) {
        instance.disconnect('connected');
      }

      instance.connect(topic);

      this.zigbeeDevices.set(sno, device.uid);
    }
  }

  async connectDevice(connection, {sno}) {
    const device = await this.api.getDeviceByVendorData(sno);

    if (!device) {
      throw new Error('No device found');
    }

    const instance = await this.getDevice(device.uid);

    if (instance) {
      if (instance.connected) {
        instance.disconnect("connect");
      }

      instance.connect(connection);
    }
  }

  getDeviceInstance(uid) {
    return this.devices.get(uid);
  }
}

module.exports = SmartHub;
