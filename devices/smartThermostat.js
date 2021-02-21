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
          get: () => 3 // auto
        },
        {
          type: this.homebridge.hap.Characteristic.TargetHeatingCoolingState,
          get: data => {
            const target = data[mac].target;
            const current = data[mac].current;
            const delta = target - current;

            if (delta < 0) {
              return 2; // cool
            } else if (delta > 0) {
              return 1; // heat
            }

            return 0; // off
          }
        },
        {
          type: this.homebridge.hap.Characteristic.TemperatureDisplayUnits,
          get: () => 0 // celsius
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
