const uuid = require('uuid/v1');
const database = require('./database');

class API {
  generateUid() {
    return uuid();
  }

  async registerDevice(pid, vid, sno, model) {
    let dbDevice = await database.Device.findOne({ pid, vid, sno, model });

    if (dbDevice) {
      return dbDevice;
    }

    const uid = this.generateUid();
    const newDevice = new database.Device({ uid, pid, vid, sno, model });

    newDevice.save();

    return newDevice;
  }

  async getDeviceByVendorData(vid, pid, sno) {
    const device = await database.Device.findOne({ vid, pid, sno });

    if (!device) {
      return null;
    }

    return device;
  }

  getAllDevices() {
    return database.Device.find();
  }

  unregisterDevice(uid) {}
}

module.exports = API;
