/*
Smart device base class/model. Should be able to get main api in constructor, should have config and lifecycle methods.
Any other smart device should inherit this class and override its methods.
 */

/**
 * Smart device base class
 * @class
 */
class SmartDevice {
  constructor(uid, api, config) {
    this.uid = uid;
    this.api = api; // device low level api
    this.config = config; // device config
    this.name = ''; // device display name
    this.connection = null; // device websocket connection
    this.capabilities = []; // device capabilities
    this.data = null; // all device returning data
  }

  load() {
    this.deviceWillLoad();

    if (!this.name) {
      this.name = 'Smart device ' + this.uid;
    }

    this.deviceDidLoad(this.uid);
  }

  sendMessage(data) {
    if (!this.connection) {
      throw new Error('Connection is not established');
    }

    this.connection.send(JSON.stringify(data));
  }

  connect(connection) {
    this.deviceWillConnect(connection);
    this.connection = connection;

    this.connection.on('close', () => this.disconnect());
    this.connection.on('error', () => this.disconnect());
    this.connection.on('message', message => this.processMessage(message));

    this.sendMessage({ type: 'success', uid: this.uid });

    this.deviceDidConnect(this.connection);
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

  async processMessage(data) {
    const message = JSON.parse(data);
    switch(message.type) {
      case 'data':
        console.log(this.uid, 'I\'ve just got some data from device', message.data);
        this.setData(message.data);
        break;
      default:
        console.log('unhandled message', message);
    }
  }

  disconnect() {
    this.deviceWillDisconnect();
    this.connection.close();
    this.connection = null;
    this.deviceDidDisconnect();
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
    console.log(this.uid, 'i will load soon');
  }

  deviceDidLoad(uid) {
    console.log(this.uid, 'I just been loaded with instance', uid);
  }

  // methods of connecting to devices network
  deviceWillConnect() {
    console.log(this.uid, 'I will connect to network soon');
  }

  deviceDidConnect(connection) {
    console.log(this.uid, 'I just been connected to the network with gateway', connection);
  }

  // methods of setting data
  deviceWillSetData(nextData) {
    console.log(this.uid, 'I\'m planning to change some data', nextData);
  }

  deviceDidSetData(prevData) {
    console.log(this.uid, 'I just changed some data', prevData, this.data);
  }

  // disconnect methods
  deviceWillDisconnect() {
    console.log(this.uid, 'I will disconnect from the network soon');
  }

  deviceDidDisconnect() {
    console.log(this.uid, 'I just been disconnected from the network');
  }

  // unload methods
  deviceWillUnload() {
    console.log(this.uid, 'i will unload soon');
  }

  deviceDidUnload() {
    console.log(this.uid, 'I just been unloaded');
  }

  // events
  getData() {
    this.sendMessage({ type: 'data' });
  }
}

module.exports = SmartDevice;
