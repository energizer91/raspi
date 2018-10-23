const API = require('./filebase');
const WebSocket = require('ws');
const devices = require('../devices');

class SmartHub {
  constructor() {
    this.api = new API();
    this.devices = {};

    this.registerDevices();

    this.wss = new WebSocket.Server({ port: 8080 });

    this.wss.on('connection', async (ws, req) => {
      console.log('New websocket connection');
      const { pid, vid, sno } = req.headers;
      const device = await this.api.getDeviceByVendorData(vid, pid, sno);

      if (!device) {
        ws.close();
        throw new Error('No device found');
      }

      const instance = this.getDeviceInstance(device.uid);

      if (instance) {
        if (!instance.connected) {
          instance.device.connect(ws);
        }
      }
    });
  }

  async registerDevices() {
    const dbDevices = await this.api.getAllDevices();

    dbDevices.forEach(dbDevice => this.registerDevice(dbDevice));
  }

  registerDevice(dbDevice) {
    if (!devices[dbDevice.model]) {
      throw new Error('Device model not found');
    }

    const { model: Device, config } = devices[dbDevice.model];
    const device = new Device(dbDevice.uid, this.api, config);

    device.load();

    this.devices[dbDevice.uid] = {
      device,
      registered: true,
      connected: false
    };

    return this.devices[dbDevice.uid];
  }

  unregisterDevice(uid) {
    const instance = this.getDeviceInstance(uid);
    if (instance.connected) {
      instance.device.disconnect();
    }

    if (instance.registered) {
      instance.device.unload();
    }
  }

  isDeviceRegistered(uid) {
    return this.devices[uid] && this.devices[uid].registered;
  }

  isDeviceConnected(uid) {
    return this.devices[uid] && this.devices[uid].connected;
  }

  getDeviceInstance(uid) {
    return this.devices[uid] || {};
  }
}

module.exports = SmartHub;
