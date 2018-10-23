const uuid = require('uuid/v1');

const records = [
  {
    uid: 'fb30ff90-d709-11e8-b74b-1d36bcbf2863',
    vid: '0001',
    pid: '0001',
    sno: '00000001',
    model: 'dummy',
    active: true
  }
];

class API {
  generateUid() {
    return uuid();
  }

  registerDevice(pid, vid, sno, model) {
    let dbDevice = records.find(record => record.pid === pid && record.vid === vid && record.sno === sno && record.model === model);

    if (dbDevice) {
      return dbDevice;
    }

    const uid = this.generateUid();
    const newDevice = { uid, pid, vid, sno, model };

    records.push(newDevice);

    return newDevice;
  }

  async getDeviceByVendorData(vid, pid, sno) {
    const device = records.find(record => record.vid === vid && record.vid === vid && record.sno === sno);;

    if (!device) {
      return null;
    }

    return device;
  }

  getAllDevices() {
    return records;
  }

  unregisterDevice(uid) {}
}

module.exports = API;
