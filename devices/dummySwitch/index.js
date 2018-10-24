const SmartDevice = require('../../models/smartDevice');
const capabilities = require('../../helpers/capabilities');

class DummySwitch extends SmartDevice {
  constructor(uid, api, data, config) {
    super(uid, api);

    this.name = 'Smart switch';
    this.capabilities = [capabilities.DUMMY];
    this.config = config;
    this.data = data;
  }

  getBulb() {
    const bulbUid = this.config.device;
    const bulb = this.api.getDevice(bulbUid);

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
    switch(signal.key) {
      case 'color':
        console.log('Changing color to', signal.value);
        this.setBulbParameters(signal.key, signal.value);
        break;
      case 'enabled':
        console.log('Changing enabled to', Boolean(signal.value));
        this.setBulbParameters(signal.key, Boolean(signal.value));
        break;
      case 'brightness':
        const bulb = this.getBulb();
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

module.exports = DummySwitch;
