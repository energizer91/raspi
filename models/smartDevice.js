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
  constructor(uid, smartHub, config) {
    super();

    this.uid = uid; // unique identifier of device
    this.sno = config.sno; // device serial number
    this.smartHub = smartHub; // device low level api
    this.homebridge = smartHub.homebridge; // homebridge instance
    this.register = smartHub.register;
    this.logger = smartHub.log;
    this.model = 'smartDevice'; // device model for HomeKit
    this.name = 'Smart device ' + this.uid; // device display name
    this.connection = null; // device websocket connection
    this.registered = false; // chack if device is loaded
    this.connected = false; // check if device is connected
    this.accessory = null; // HomeKit accessory
    this.services = []; // list of HomeKit services
    this.data = null; // all device returning data
    this.dweetUrl = `https://dweet.io:443/dweet/for/${this.uid}`; // link for posting dweets
  }

  load() {
    this.deviceWillLoad();

    if (this.homebridge) {
      this.services = this.getServices();
    }

    this.registered = true;
    this.emit('load');

    this.deviceDidLoad();
  }

  log(...args) {
    return this.logger(this.uid, this.name, '->', ...args);
  }

  warn(...args) {
    return this.logger.warn(this.uid, this.name, '->', ...args);
  }

  error(...args) {
    return this.logger.error(this.uid, this.name, '->', ...args);
  }

  sendMessage(data) {
    if (!this.connection) {
      this.error('Connection is not established');
      return;
    }

    this.connection.send(JSON.stringify(data));
  }

  sendMessageWithResponse(message, delay = 10000) {
    const uuid = uuidv1();

    if (!this.connection) {
      return Promise.reject(new Error('Connection is not established'));
    }

    this.sendMessage({ ...message, uuid });

    return new Promise((resolve, reject) => {
      messageQueue.addMessage(uuid, (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      }, delay);
    });
  }

  receiveMessage(message) {
    const { uuid, ...other } = message;

    if (messageQueue.hasQueue(uuid)) {
      messageQueue.resolveMessage(uuid, other);
    }
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
    this.pingInterval = setInterval(() => this.ping(), 60000);

    this.deviceDidConnect(this.connection);
  }

  /** set data for device and send it to device directly */
  setData(data, skipUpdate = false) {
    this.deviceWillSetData(data);

    const prevData = this.data;

    if (typeof data === 'object') {
      this.data = Object.assign({}, this.data, data);
    } else {
      this.data = data;
    }

    if (!skipUpdate) {
      this.sendData(data);
    }

    this.deviceDidSetData(prevData);
  }

  dweetData(data) {
    return axios.post(this.dweetUrl, data);
  }

  processMessage(data) {
    const message = JSON.parse(data);

    this.log('Processing message', message);
    if (message.uuid && message.type !== 'request') {
      return this.receiveMessage(message);
    }

    switch(message.type) {
      case 'signal':
        this.onGetSignal(message.signal);
        break;
      case 'request':
        this.onGetAPIRequest(message);
        break;
      default:
        this.log('Unhandled message', message);
    }
  }

  disconnect() {
    this.deviceWillDisconnect();

    clearInterval(this.pingInterval);

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

  /** Get available services if we have homebridge */
  getServices() {
    // this.log('I\'m trying to get services');
  }

  // load methods
  deviceWillLoad() {
    // this.log('I will load soon');
  }

  deviceDidLoad() {
    // this.log('I just been loaded');
  }

  // methods of connecting to devices network
  deviceWillConnect() {
    // this.log('I will connect to network soon');
  }

  deviceDidConnect() {
    // this.log('I just been connected to the network');
  }

  // methods of setting data
  deviceWillSetData(nextData) {
    // this.log('I\'m planning to change some data', nextData);
  }

  deviceDidSetData(prevData) {
    // this.log('I just changed some data', prevData, this.data);
  }

  // disconnect methods
  deviceWillDisconnect() {
    // this.log('I will disconnect from the network soon');
  }

  deviceDidDisconnect() {
    // this.log('I just been disconnected from the network');
  }

  // unload methods
  deviceWillUnload() {
    // this.log('I will unload soon');
  }

  deviceDidUnload() {
    // this.log('I just been unloaded');
  }

  /** ping device every minute */
  ping() {
    this.log('Sending ping');
    this.sendMessageWithResponse({ type: 'ping' })
      .catch(error => {
        this.error('Sending ping error', error);
        this.error('Device is not responding. Disconnecting...');

        this.disconnect();
      })
  }

  /** get data directly from device */
  getData() {
    if (!this.connection) {
      return Promise.resolve(this.data);
    }

    return this.sendMessageWithResponse({ type: 'get' })
      .then(message => {
        const { data } = message;

        this.setData(data, true);

        return data;
      })
      .catch(error => {
        this.error('Sending message with response error', error);

        return this.data;
      });
  }

  /** HomeKit devices identification */
  identify(paired) {
    this.log('Identify!', paired, this.connected);

    return Promise.resolve(this.connected);
  }

  /** send data directly to device */
  sendData(data) {
    this.sendMessage({ type: 'send', data });
  }

  /** get some specific information (called signals) from device */
  onGetSignal(signal) {
    // this.log('I just got signal', signal);
  }

  onGetAPIRequest(request = { uuid: '', command: '', payload: {} }) {
    if (!request.uuid) {
      this.error('Invalid Request: no uuid field', request);
    }

    const uuid = request.uuid;

    switch (request.command) {
      case 'getDevices':
        const devices = Array
          .from(this.smartHub.getRegisteredDevices())
          .map(([_, device]) => ({
            uid: device.uid,
            name: device.name,
            connected: device.connected,
            registered: device.registered
          }));

        return this.sendAPIResponse(uuid, { devices });
      case 'getDevice':
        if (!request.payload) {
          return this.sendAPIError(uuid, 'No payload');
        }

        const device = this.smartHub.getDevice(request.payload.uid);

        if (!device) {
          return this.sendAPIError(uuid, 'Device is not found');
        }

        return this.sendAPIResponse(uuid, {
          uid: device.uid,
          name: device.name,
          connected: device.connected,
          registered: device.registered,
          data: device.data
        });
      case 'makeHTTPCall':
        if (!request.payload) {
          return this.sendAPIError(uuid, 'No payload');
        }

        if (!request.payload.method) {
          return this.sendAPIError(uuid, 'No method');
        }

        if (!request.payload.url) {
          return this.sendAPIError(uuid, 'No URL');
        }

        if (!request.payload.data && !request.payload.params) {
          return this.sendAPIError(uuid, 'No data or params');
        }

        this.log('Making API request', uuid, request.payload);

        return axios(request.payload)
          .then(response => {
            this.log('Getting API response', uuid, response.data);
            return this.sendAPIResponse(uuid, response.data);
          })
          .catch(error => this.sendAPIError(uuid, JSON.stringify(error.response)));

      default:
        return this.sendAPIError(uuid, 'Unknown command ' + request.command);
    }
  }

  sendAPIResponse(uuid, response) {
    return this.sendMessage({
      type: 'response',
      uuid,
      response
    })
  }

  sendAPIError(uuid, message) {
    return this.sendMessage({
      type: 'response_error',
      uuid,
      message
    });
  }

  /** send specific signal to device */
  sendSignal(signal) {
    // this.log('I\'m sending signal to device', signal);
    this.sendMessage({ type: 'signal', signal });
  }

  /** create HomeKit accessory */
  createAccessory() {
    if (!this.homebridge) {
      return;
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

  /** attach HomeKit characteristics to accessory */
  attachServiceCharacteristics(accessory) {
    if (!this.homebridge) {
      return;
    }

    this.accessory = accessory;

    this.attachSensorsData();
  }

  /** attach sensors data to accessories */
  attachSensorsData() {
    if (!this.services || !this.services.length) {
      this.log('No services found');

      return;
    }

    this.services.forEach(service => this.attachSensorData(service));
    this.enableUpdates();
  }

  /** attach sensor data per each sensor */
  attachSensorData(service) {
    if (!this.homebridge) {
      return;
    }

    if (!service) {
      return;
    }

    if (!service.characteristics) {
      return null;
    }

    service.characteristics.forEach(characteristic => {
      if (characteristic.metric && characteristic.metric.type) {
        const {type: MetricType, ...rest} = characteristic.metric;

        characteristic.metric.instance = new MetricType(rest);

        this.register.registerMetric(characteristic.metric.instance);
      }

      if (characteristic.get) {
        this.accessory.getService(service.name)
          .getCharacteristic(characteristic.type)
          .on('get', callback => this.getData()
            .then(data => {
              const value = characteristic.get(data);

              this.log('Get', service.name, value);

              if (characteristic.metric && characteristic.metric.instance) {
                characteristic.metric.instance.set(value);
              }

              callback(null, value);
            })
            .catch(callback));
      }

      if (characteristic.set) {
        this.accessory.getService(service.name)
          .getCharacteristic(characteristic.type)
          .on('set', (value, callback) => {
            this.log('Set', service.name, characteristic.set(value));

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

  /** update devices info every minute */
  notifyChanges() {
    if (!this.connected) {
      // this.disableUpdates();

      return;
    }

    this.getData()
      .then(data => {
        if (!this.services || !this.services.length || !this.accessory) {
          this.log('No service or accessory found');
	        return;
        }

        this.services.forEach(service => {
          service.characteristics.forEach(characteristic => {
            const value = characteristic.get(data);
            this.log('Update', service.name, characteristic.get(data));

            if (characteristic.metric && characteristic.metric.instance) {
              this.log('Setting metric', value);
              characteristic.metric.instance.set(value);
            }

            this.accessory.getService(service.name)
              .getCharacteristic(characteristic.type)
              .updateValue(value)
          })
        });

        this.dweetData(data);
      })
      .catch(error => this.error('Unable to update value', error));
  }

  enableUpdates() {
    this.updateInterval = setInterval(() => this.notifyChanges(), 60000);
  }

  disableUpdates() {
    clearInterval(this.updateInterval);
  }
}

module.exports = SmartDevice;
