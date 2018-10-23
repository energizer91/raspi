/*
Smart device base class/model. Should be able to get main api in constructor, should have config and lifecycle methods.
Any other smart device should inherit this class and override its methods.
 */

/**
 * Smart device base class
 * @class
 */
class SmartDevice {
    name = ''; // device display name
    instance = null; // device instance with all params
    uid = null; // device unique identifier
    gateway = null; // device network gateway
    capabilities = []; // device capabilities
    data = null; // all device returning data

    constructor(config, api) {
        this.api = api; // device low level api
        this.config = config; // device config
    }

    load() {
        this.uid = this.api.generateUid();

        if (!this.name) {
            this.name = 'Smart device ' + this.uid;
        }

        this.deviceWillLoad(this.uid);

        this.instance = this.api.registerDevice(this.uid, this.capabilities);

        this.deviceDidLoad(this.instance, this.uid);
    }

    async connect() {
        this.deviceWillConnect();

        return this.api.connect(this.config)
            .then(gateway => {
                this.gateway = gateway;

                this.deviceDidConnect(this.gateway);
            });
    }

    ping() {
        console.log('somebody\'s just pinged me');

        return 'pong';
    }

    setData(data) {
        this.deviceWillSetData(data);

        const prevData = this.data;
        this.data = data;
        this.deviceDidSetData(prevData);
    }

    tick() {
        console.log('tick');
    }

    async unload() {
        this.deviceWillDisconnect();

        return this.api.disconnect()
            .then(() => {
                this.gateway = null;

                this.deviceDidDisconnect();
            });
    }

    unload() {
        this.deviceWillUnload();

        this.api.unregisterDevice(this.uid);
        this.instance = null;
        this.uid = null;

        this.deviceDidUnload();
    }

    // load methods
    deviceWillLoad() {
        console.log('i will load soon');
    }

    deviceDidLoad(instance, uid) {
        console.log('I just been loaded with instance', instance, uid);
    }

    // methods of connecting to devices network
    deviceWillConnect() {
        console.log('I will connect to network soon');
    }

    deviceDidConnect(gateway) {
        console.log('I just been connected to the network with gateway', gateway);
    }

    // methods of setting data
    deviceWillSetData(nextData) {
        console.log('I\'m planning to change some data', nextData);
    }

    deviceDidSetData(prevData) {
        console.log('I just changed some data', prevData, this.data);
    }

    // disconnect methods
    deviceWillDisconnect() {
        console.log('I will disconnect from the network soon');
    }

    deviceDidDisconnect() {
        console.log('I just been disconnected from the network');
    }

    // unload methods
    deviceWillUnload() {
        console.log('i will unload soon');
    }

    deviceDidUnload() {
        console.log('I just been unloaded');
    }

    // events
    onGetData() {
        return this.data;
    }
}

module.exports = SmartDevice;
