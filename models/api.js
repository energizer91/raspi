const uuid = require('uuid/v5');

class API {
    devices = {};

    generateUid() {
        return uuid();
    }

    registerDevice(uid, device) {
        this.devices[uid] = {
            device
        };

        return this.devices[uid];
    }

    unregisterDevice(uid) {
        return delete this.devices[uid];
    }
}

module.exports = API;
