const SmartDevice = require('../models/smartDevice');
const capabilities = require('../helpers/capabilities');

class DummyDevice extends SmartDevice {
    constructor(config, api) {
        super(config, api);

        this.name = 'Dummy device';
        this.capabilities = [capabilities.DUMMY];
        this.data = new Date().getTime();
    }

    onGetData() {
        this.setData(new Date().getTime());

        return this.data;
    }
}

module.exports = DummyDevice;
