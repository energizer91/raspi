const API = require('./api');
const WebSocket = require('ws');
const devices = require('../devices');
const EventEmitter = require('events');

class SmartHub extends EventEmitter {
  constructor(homebridge) {
    super();

    this.api = new API();
    this.devices = {};
    this.name = 'energizer91\'s Smart hub';
    this.manufacturer = 'energizer91';
    this.homebridge = homebridge;

    this.wss = new WebSocket.Server({port: 8080});

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

    if (!devices[dbDevice.model]) {
      throw new Error('Device model not found');
    }

    const {vid, pid, sno} = dbDevice;
    const Device = devices[dbDevice.model];

    const device = new Device(dbDevice.uid, {
      getDevice: uid => this.getDeviceInstance(uid),
      emit: (...args) => this.emit(...args),
      homebridge: this.homebridge,
      manufacturer: this.manufacturer
    }, dbDevice.data, dbDevice.config, vid, pid, sno);

    device.load();

    this.devices[dbDevice.uid] = device;

    return this.devices[dbDevice.uid];
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

  getRegisteredDevices() {
    return this.devices;
  }

  async getDevice(uid) {
    if (this.devices[uid]) {
      return this.devices[uid];
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
    return this.devices[uid];
  }
}

module.exports = SmartHub;
