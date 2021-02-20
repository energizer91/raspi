const SmartDevice = require('../models/smartDevice');

class SmartThermostat extends SmartDevice {
  constructor(uid, smartHub, config) {
    super(uid, smartHub, config);

    this.model = 'smartThermostat';
    this.name = 'Smart thermostat';
    this.data = Object.assign({}, config.data);
    this.asyncrhonousServices = true; // To load thermostats dynamically
    this.servicesAttached = false;
  }

  getThermostatService(mac, name) {
    return {
      name: name || "Thermostat",
      type: this.homebridge.hap.Service.Thermostat,
      characteristics: [
        {
          type: this.homebridge.hap.Characteristic.CurrentTemperature,
          get: data => data[mac].current,
          props: {
            minValue: 6,
            maxValue: 28
          }
        },
        {
          type: this.homebridge.hap.Characteristic.TargetTemperature,
          get: data => data[mac].target,
          set: value => ({
            [mac]: { target: value }
          })
        },
        {
          type: this.homebridge.hap.Characteristic.CurrentHeatingCoolingState,
          get: data => data[mac].currentHeatingCooling
        },
        {
          type: this.homebridge.hap.Characteristic.TargetHeatingCoolingState,
          get: data => data[mac].targetHeatingCooling
        },
        {
          type: this.homebridge.hap.Characteristic.TemperatureDisplayUnits,
          get: () => 0
        },
      ]
    }
  }

  deviceDidConnect() {
    if (this.servicesAttached) {
      return;
    }

    this.getData()
      .then(data => {
        this.services = Object.keys(data).map(mac => this.getThermostatService(mac, data.name));

        this.attachServices();
        this.servicesAttached = true;
      })
  }
}

module.exports = SmartThermostat;
