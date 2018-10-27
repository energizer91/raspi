const API = require('./filebase');
const WebSocket = require('ws');
const devices = require('../devices');
const EventEmitter = require('events');

class SmartHub extends EventEmitter {
  constructor() {
    super();

    this.api = new API();
    this.devices = {};
    this.name = 'energizer91\'s Smart hub';

    this.registerDevices();

    this.wss = new WebSocket.Server({port: 8080});

    this.wss.on('connection', (ws, req) => {
      const {pid, vid, sno} = req.headers;

      console.log('New websocket connection', pid, vid, sno);

      this.connectDevice(ws, {pid, vid, sno});
    })
  }

  async registerDevices() {
    const dbDevices = await this.api.getAllDevices();

    return dbDevices.map(dbDevice => this.registerDevice(dbDevice));
  }

  registerDevice(dbDevice) {
    if (!devices[dbDevice.model]) {
      throw new Error('Device model not found');
    }

    const Device = devices[dbDevice.model];
    const device = new Device(dbDevice.uid, {
      getDevice: uid => this.getDevice(uid),
      emit: (...args) => this.emit(...args)
    }, dbDevice.data, dbDevice.config);

    device.load();

    this.devices[dbDevice.uid] = device;

    return this.devices[dbDevice.uid];
  }

  unregisterDevice(uid) {
    const device = this.getDeviceInstance(uid);
    if (device.connected) {
      device.disconnect();
    }

    if (device.registered) {
      device.unload();
    }
  }

  getRegisteredDevices() {
    return this.devices;
  }

  getDevice(uid) {
    return this.devices[uid];
  }

  async connectDevice(connection, {vid, pid, sno}) {
    const device = await this.api.getDeviceByVendorData(vid, pid, sno);

    if (!device) {
      connection.close();
      throw new Error('No device found');
    }

    const instance = this.getDeviceInstance(device.uid);

    if (instance) {
      if (instance.connected) {
        instance.disconnect();
      }

      instance.connect(connection);
    }
  }

  getDeviceInstance(uid) {
    return this.devices[uid] || {};
  }
}

module.exports = SmartHub;
