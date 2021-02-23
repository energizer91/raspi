const SmartThermometer = require('./smartThermometer');

class SmartMeteoStation extends SmartThermometer {
  constructor(uid, smartHub, config) {
    super(uid, smartHub, config);

    this.model = 'SmartMeteoStation';
    this.name = 'Smart meteo station';
  }
}

module.exports = SmartMeteoStation;
