const Sequelize = require('sequelize');
const config = require('config');

const sequelize = new Sequelize(config.get('database.name'), config.get('database.username'), config.get('database.password'), config.get('database.connection'));

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
  },
  {
    uid: 'fd51f870-d9f6-11e8-bff5-41cc63aa46da',
    vid: '0001',
    pid: '0007',
    sno: '00000007',
    model: 'smartAlarm',
    active: true,
    data: {
      lightLevel: 0
    }
  },
  {
    uid: '8772f930-dbb6-11e8-bd39-2b0413a4144a', // change it!
    vid: '0001',
    pid: '0008',
    sno: '00000008',
    model: 'smartHumidifier',
    active: true,
    data: {
      fanSpeed: 0,
      enabled: false,
      color: '#FFFFFF',
      waterLevel: 0,
      filterStatus: 1
    }
  }
];

const Device = sequelize.define('device', {
  uid: { type: Sequelize.UUID },
  vid: { type: Sequelize.STRING },
  pid: { type: Sequelize.STRING },
  sno: { type: Sequelize.STRING },
  model: { type: Sequelize.STRING },
  active: { type: Sequelize.BOOLEAN, default: true },
  data: {
    type: Sequelize.TEXT,
    get: function () {
      return JSON.parse(this.getDataValue('data'));
    },
    set: function (value) {
      return this.setDataValue('data', JSON.stringify(value));
    }
  },
  config: {
    type: Sequelize.TEXT,
    get: function () {
      return JSON.parse(this.getDataValue('config'));
    },
    set: function (value) {
      return this.setDataValue('config', JSON.stringify(value));
    }
  }
});

Device.sync()
  .then(() => {
    // Device.create({
    //   uid: '8772f930-dbb6-11e8-bd39-2b0413a4144a', // change it!
    //   vid: '0001',
    //   pid: '0008',
    //   sno: '00000008',
    //   model: 'smartHumidifier',
    //   active: true,
    //   data: {
    //     hue: 0,
    //     saturation: 0,
    //     value: 0,
    //     fanSpeed: 0,
    //     changeFilter: 0,
    //     lowWaterLevel: false,
    //     doorOpen: false
    //   }
    // })
  })
  .catch(err => console.log('Sync error', err));

sequelize
  .authenticate()
  .then(() => console.log('Connection has been established successfully.'))
  .catch(err => console.error('Unable to connect to the database:', err));

module.exports = {
  Device
};
