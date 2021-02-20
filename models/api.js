const uuid = require('uuid/v1');
const database = require('./database');

class API {
  generateUid() {
    return uuid();
  }

  async registerDevice(pid, vid, sno, model, data) {
    let dbDevice = await database.Device.findOne({where: { pid, vid, sno, model }});

    if (dbDevice) {
      return dbDevice;
    }

    const uid = this.generateUid();
    const newDevice = new database.Device({ uid, pid, vid, sno, model, data, active: true });

    await newDevice.save();

    return newDevice;
  }

  getDevice(uid) {
    return database.Device.findOne({where: { uid }});
  }

  async getDeviceByVendorData(vid, pid, sno) {
    const device = await database.Device.findOne({where: { vid, pid, sno }});

    if (!device) {
      return null;
    }

    return device;
  }

  getAllDevices() {
    return database.Device.findAll();
  }

  getDatabase() {
    return database;
  }

  async unregisterDevice(uid) {
    await database.Device.remove({where: { uid }});
  }
}

module.exports = API;
