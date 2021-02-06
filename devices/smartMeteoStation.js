const SmartDevice = require('../models/smartDevice');

class SmartMeteoStation extends SmartDevice {
  constructor(uid, smartHub, config) {
    super(uid, smartHub, config);

    this.model = 'SmartMeteoStation';
    this.name = 'Smart meteo station';
    this.data = Object.assign({
      weather: "",
      city: "",
      temperature: 0,
      humidity: 0
    }, config.data);
  }
}

module.exports = SmartMeteoStation;
