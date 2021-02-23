const SmartThermometer = require('./smartThermometer');

class SmartMeteoStation extends SmartThermometer {
  constructor(uid, smartHub, config) {
    super(uid, smartHub, config);

    this.model = 'smartMeteoStation';
    this.name = 'Smart meteo station';
  }
}

module.exports = SmartMeteoStation;
