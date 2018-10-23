const API = require('./api');

class SmartHub {
    constructor() {
        this.api = new API();
    }

    registerDevice(Device) {
        const device = new Device({}, this.api);

        device.load();
        device.connect();

        return device;
    }

    unregisterDevice(device) {
        if (device.gateway) {
            device.disconnect();
        }

        if (device.instance) {
            device.unload();
        }
    }
}
