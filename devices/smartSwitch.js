const SmartDevice = require('../models/smartDevice');

class SmartSwitch extends SmartDevice {
  constructor(uid, smartHub, config) {
    super(uid, smartHub, config);

    this.model = 'smartSwitch';
    this.name = 'Smart switch';
    this.config = config.config;
    this.data = Object.assign({
      device: ''
    }, config.data);
  }

  getBulb() {
    const bulbUid = this.config.device;
    const bulb = this.smartHub.getDeviceInstance(bulbUid);

    if (!bulb || !bulb.connected) {
      throw new Error('Bulb is not connected');
    }

    return bulb;
  }

  setBulbParameters(key, value) {
    const bulb = this.getBulb();

    if (!bulb || !bulb.connected) {
      throw new Error('Bulb is not connected');
    }

    bulb.setData({[key]: value});
  }

  onGetSignal(signal) {
    let bulb;
    switch(signal.key) {
      case 'color':
        console.log('Changing color to', signal.value);
        this.setBulbParameters(signal.key, signal.value);
        break;
      case 'enabled':
        bulb = this.getBulb();

        const newEnabled = !bulb.data.enabled;

        console.log('Changing enabled to', newEnabled);
        this.setBulbParameters(signal.key, newEnabled);
        break;
      case 'brightness':
        bulb = this.getBulb();

        let bulbBrightness = bulb.data.brightness + Number(signal.value);

        if (bulbBrightness > 100) {
          bulbBrightness = 100;
        } else if (bulbBrightness < 0) {
          bulbBrightness = 0;
        }

        console.log('Changing brightness to', bulbBrightness);
        this.setBulbParameters(signal.key, bulbBrightness);
        break;
      default:
        console.log('Unknown signal key', signal.key);
    }
  }
}

module.exports = SmartSwitch;
