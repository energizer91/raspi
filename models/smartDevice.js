/*
Smart device base class/model. Should be able to get main api in constructor, should have config and lifecycle methods.
Any other smart device should inherit this class and override its methods.
 */

const uuidv1 = require('uuid/v1');
const messageQueue = require('../helpers/messageQueue');
const EventEmitter = require('events');

/**
 * Smart device base class
 * @class
 */
class SmartDevice extends EventEmitter {
  constructor(uid, smartHub) {
    super();

    this.uid = uid;
    this.smartHub = smartHub; // device low level api
    this.name = 'Smart device ' + this.uid; // device display name
    this.connection = null; // device websocket connection
    this.registered = false;
    this.connected = false;
    this.capabilities = []; // device capabilities
    this.data = null; // all device returning data
  }

  load() {
    this.deviceWillLoad();

    this.registered = true;
    this.emit('load');

    this.deviceDidLoad();
  }

  sendMessage(data) {
    if (!this.connection) {
      throw new Error('Connection is not established');
    }

    this.connection.send(JSON.stringify(data));
  }

  receiveMessage(message) {
    const { uuid, data } = message;

    if (messageQueue.hasQueue(uuid)) {
      messageQueue.resolveMessage(uuid, data);
    }

    this.setData(data);
  }

  connect(connection) {
    this.deviceWillConnect(connection);
    this.connection = connection;
    this.connected = true;

    this.connection.on('close', () => this.disconnect());
    this.connection.on('error', () => this.disconnect());
    this.connection.on('message', message => this.processMessage(message));
    this.sendData(this.data);
    this.emit('connected');

    this.deviceDidConnect(this.connection);
  }

  setData(data) {
    this.deviceWillSetData(data);

    const prevData = this.data;
    if (typeof data === 'object') {
      this.data = Object.assign({}, this.data, data);
    } else {
      this.data = data;
    }

    this.sendData(data);

    this.deviceDidSetData(prevData);
  }

  processMessage(data) {
    const message = JSON.parse(data);

    switch(message.type) {
      case 'data':
        console.log(this.uid, this.name, '-> I\'ve just got some data from device', message.data);
        this.receiveMessage(message);
        break;
      case 'signal':
        this.onGetSignal(message.signal);
        break;
      default:
        console.log('unhandled message', message);
    }
  }

  disconnect() {
    this.deviceWillDisconnect();

    if (this.connection) {
      this.connection.close();
    }

    this.connection = null;
    this.connected = false;

    this.emit('disconnected');

    this.deviceDidDisconnect();
  }

  unload() {
    this.deviceWillUnload();

    this.registered = false;

    this.deviceDidUnload();
  }

  // load methods
  deviceWillLoad() {
    console.log(this.uid, this.name, '-> I will load soon');
  }

  deviceDidLoad() {
    console.log(this.uid, this.name, '-> I just been loaded');
  }

  // methods of connecting to devices network
  deviceWillConnect() {
    console.log(this.uid, this.name, '-> I will connect to network soon');
  }

  deviceDidConnect() {
    console.log(this.uid, this.name, '-> I just been connected to the network');
  }

  // methods of setting data
  deviceWillSetData(nextData) {
    console.log(this.uid, this.name, '-> I\'m planning to change some data', nextData);
  }

  deviceDidSetData(prevData) {
    console.log(this.uid, this.name, '-> I just changed some data', prevData, this.data);
  }

  // disconnect methods
  deviceWillDisconnect() {
    console.log(this.uid, this.name, '-> I will disconnect from the network soon');
  }

  deviceDidDisconnect() {
    console.log(this.uid, this.name, '-> I just been disconnected from the network');
  }

  // unload methods
  deviceWillUnload() {
    console.log(this.uid, this.name, '-> I will unload soon');
  }

  deviceDidUnload() {
    console.log(this.uid, this.name, '-> I just been unloaded');
  }

  // get data directly from device
  getData() {
    const uuid = uuidv1();

    if (!this.connection) {
      return this.data;
    }

    this.sendMessage({ type: 'get', uuid });

    return new Promise((resolve, reject) => {
      messageQueue.addMessage(uuid, (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      }, 10000);
    });
  }

  identity(paired) {
    console.log(this.uid, this.name, '-> Identity!', paired);

    return Promise.resolve(true);
  }

  // send data directly to device
  sendData(data) {
    console.log(this.uid, this.name, '-> I\'m sending data to device', data);
    this.sendMessage({ type: 'send', data });
  }

  // get some specific information (called signals) from device
  onGetSignal(signal) {
    console.log(this.uid, this.name, '-> I just got signal', signal);
  }

  // send specific signal to device
  sendSignal(signal) {
    console.log(this.uid, this.name, '-> I\'m sending signal to device', signal);
    this.sendMessage({ type: 'signal', signal });
  }

  createAccessory(Accessory, Service, Characteristic) {
    console.log(this.uid, this.name, '-> I\'m gonna connect to HomeKit!');
  }
}

module.exports = SmartDevice;
