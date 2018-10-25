const uuid = require('uuid/v1');

const records = [
  {
    uid: 'fb30ff90-d709-11e8-b74b-1d36bcbf2863',
    vid: '0001',
    pid: '0001',
    sno: '00000001',
    model: 'dummy',
    active: true,
    data: {
      enabled: false,
      brightness: 70
    }
  },
  {
    uid: '03cef9e0-d77d-11e8-a560-e79cff6a8292',
    vid: '0001',
    pid: '0002',
    sno: '00000002',
    model: 'dummySwitch',
    active: true,
    config: {
      device: 'fb30ff90-d709-11e8-b74b-1d36bcbf2863'
    }
  },
  {
    uid: '8bf61060-d881-11e8-a5c5-bf50ed08d44f',
    vid: '0001',
    pid: '0003',
    sno: '00000003',
    model: 'smartThermometer',
    active: true,
    data: {
      temperature: 0,
      humidity: 0
    }
  },
  {
    uid: 'e6237b70-d892-11e8-87ca-676fdf94a198',
    vid: '0001',
    pid: '0006',
    sno: '00000006',
    model: 'smartRGB',
    active: true,
    data: {
      enabled: true,
      color: '#FF0000'
    }
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
