const Sequelize = require('sequelize');
const config = require("config");

const sequelize = new Sequelize(config.get("database.name"), config.get("database.username"), config.get("database.password"), config.get("database.connection"));

const Device = sequelize.define('device', {
  uid: {type: Sequelize.UUID},
  vid: {type: Sequelize.STRING},
  pid: {type: Sequelize.STRING},
  sno: {type: Sequelize.STRING},
  model: {type: Sequelize.STRING},
  active: {type: Sequelize.BOOLEAN, default: true},
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
  .catch(err => console.log('Sync error', err));

sequelize
  .authenticate()
  .then(() => console.log('Connection has been established successfully.'))
  .catch(err => console.error('Unable to connect to the database:', err));

module.exports = {
  Device
};
