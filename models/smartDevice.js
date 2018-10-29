/*
Smart device base class/model. Should be able to get main api in constructor, should have config and lifecycle methods.
Any other smart device should inherit this class and override its methods.
 */

const uuidv1 = require('uuid/v1');
const messageQueue = require('../helpers/messageQueue');
const EventEmitter = require('events');
const axios = require('axios');

/**
 * Smart device base class
 * @class
 */
class SmartDevice extends EventEmitter {
  constructor(uid, smartHub, sno) {
    super();

    this.uid = uid;
    this.sno = sno;
    this.smartHub = smartHub; // device low level api
    this.homebridge = smartHub.homebridge;
    this.model = 'smartDevice';
    this.name = 'Smart device ' + this.uid; // device display name
    this.connection = null; // device websocket connection
    this.registered = false;
    this.connected = false;
    this.accessory = null; // HomeKit accessory
    this.services = [];
    this.data = null; // all device returning data
    this.dweetUrl = `https://dweet.io:443/dweet/for/${this.uid}`;
    this.updateInterval = null;
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

  dweetData(data) {
    return axios.post(this.dweetUrl, data);
  }

  processMessage(data) {
    const message = JSON.parse(data);

    switch(message.type) {
      case 'data':
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
    // console.log(this.uid, this.name, '-> I will load soon');
  }

  deviceDidLoad() {
    // console.log(this.uid, this.name, '-> I just been loaded');
  }

  // methods of connecting to devices network
  deviceWillConnect() {
    // console.log(this.uid, this.name, '-> I will connect to network soon');
  }

  deviceDidConnect() {
    // console.log(this.uid, this.name, '-> I just been connected to the network');
  }

  // methods of setting data
  deviceWillSetData(nextData) {
    // console.log(this.uid, this.name, '-> I\'m planning to change some data', nextData);
  }

  deviceDidSetData(prevData) {
    // console.log(this.uid, this.name, '-> I just changed some data', prevData, this.data);
  }

  // disconnect methods
  deviceWillDisconnect() {
    // console.log(this.uid, this.name, '-> I will disconnect from the network soon');
  }

  deviceDidDisconnect() {
    // console.log(this.uid, this.name, '-> I just been disconnected from the network');
  }

  // unload methods
  deviceWillUnload() {
    // console.log(this.uid, this.name, '-> I will unload soon');
  }

  deviceDidUnload() {
    // console.log(this.uid, this.name, '-> I just been unloaded');
  }

  // get data directly from device
  getData() {
    const uuid = uuidv1();

    if (!this.connection) {
      return Promise.resolve(this.data);
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

  identify(paired) {
    console.log(this.uid, this.name, '-> Identify!', paired);

    return Promise.resolve(true);
  }

  // send data directly to device
  sendData(data) {
    this.sendMessage({ type: 'send', data });
  }

  // get some specific information (called signals) from device
  onGetSignal(signal) {
    // console.log(this.uid, this.name, '-> I just got signal', signal);
  }

  // send specific signal to device
  sendSignal(signal) {
    // console.log(this.uid, this.name, '-> I\'m sending signal to device', signal);
    this.sendMessage({ type: 'signal', signal });
  }

  createAccessory() {
    if (!this.homebridge) {
      throw new Error('Homebridge is not defined');
    }

    this.accessory = new this.homebridge.platformAccessory(this.model, this.uid);

    this.accessory
      .getService(this.homebridge.hap.Service.AccessoryInformation)
      .setCharacteristic(this.homebridge.hap.Characteristic.Manufacturer, this.smartHub.manufacturer)
      .setCharacteristic(this.homebridge.hap.Characteristic.Model, this.name)
      .setCharacteristic(this.homebridge.hap.Characteristic.SerialNumber, this.sno);

    this.services.forEach(service => {
      const ServiceConstructor = service.type;

      const sensor = new ServiceConstructor(service.name);

      this.accessory.addService(sensor);

      this.attachSensorData(service);
    });

    return this.accessory;
  }

  attachServiceCharacteristics(accessory) {
    if (!this.homebridge) {
      throw new Error('Homebridge is not defined');
    }

    this.accessory = accessory;

    this.attachSensorsData();
  }

  attachSensorsData() {
    if (!this.services || !this.services.length) {
      return;
    }

    this.services.forEach(service => this.attachSensorData(service));
    this.enableUpdates();
  }

  attachSensorData(service) {
    if (!service) {
      return;
    }

    if (!service.chatacteristics) {
      return null;
    }

    service.chatacteristics.forEach(characteristic => {
      if (characteristic.get) {
        this.accessory.getService(service.name)
          .getCharacteristic(characteristic.type)
          .on('get', callback => this.getData()
            .then(data => callback(null, characteristic.get(data)))
            .catch(err => callback(err)));
      }

      if (characteristic.set) {
        this.accessory.getService(service.name)
          .getCharacteristic(characteristic.type)
          .on('set', (value, callback) => {
            this.setData(characteristic.set(value));
            callback();
          });
      }

      if (characteristic.props) {
        this.accessory.getService(service.name)
          .getCharacteristic(characteristic.type)
          .setProps(characteristic.props);
      }
    })
  }

  notifyChanges() {
    if (!this.connected) {
      return;
    }

    this.getData()
      .then(data => {
        if (!this.services || !this.services.length || !this.accessory) {
          return;
        }

        this.services.forEach(service => {
          service.characteristics.forEach(characteristic => {
            this.accessory.getService(service.name)
              .getCharacteristic(characteristic.type)
              .updateValue(service.value(data))
          })
        });

        this.dweetData(data);
      })
      .catch(error => console.error(this.uid, this.name, '-> Unable to update value', error));
  }

  enableUpdates() {
    this.updateInterval = setInterval(() => this.notifyChanges(), 60000);
  }

  disableUpdates() {
    clearInterval(this.updateInterval);
  }
}

module.exports = SmartDevice;
