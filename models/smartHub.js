const API = require('./api');
const WebSocket = require('ws');
const deviceModels = require('../devices');
const EventEmitter = require('events');
const config = require('config');

class SmartHub extends EventEmitter {
  constructor(homebridge, prometheusRegister) {
    super();

    this.api = new API();
    this.devices = new Map();
    this.manufacturer = config.get("smarthub.manufacturer");
    this.homebridge = homebridge;
    this.prometheusRegister = prometheusRegister;

    this.wss = new WebSocket.Server({port: config.get("connection.port")});

    this.wss.on('connection', (ws, req) => {
      const {pid, vid, sno} = req.headers;

      this.connectDevice(ws, {pid, vid, sno})
        .catch(error => console.error('Error connecting device', error));
    })
  }

  registerDevice(dbDevice) {
    if (!dbDevice.active) {
      return;
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
      register: this.prometheusRegister
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
      device.disconnect();
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

  async connectDevice(connection, {vid, pid, sno}) {
    const device = await this.api.getDeviceByVendorData(vid, pid, sno);

    if (!device) {
      connection.close();
      throw new Error('No device found');
    }

    const instance = await this.getDevice(device.uid);

    if (instance) {
      if (instance.connected) {
        instance.disconnect();
      }

      instance.connect(connection);
    }
  }

  getDeviceInstance(uid) {
    return this.devices.get(uid);
  }
}

module.exports = SmartHub;
