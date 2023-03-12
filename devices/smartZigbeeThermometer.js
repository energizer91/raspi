const SmartDevice = require("../models/smartDevice");
const client = require("prom-client");

class smartZigbeeThermometer extends SmartDevice {
  constructor(uid, smartHub, config) {
    super(uid, smartHub, config);

    this.model = 'smartZigbeeThermometer';
    this.name = 'Smart Zigbee thermometer';
    this.homekit = false;
    this.topic = '';
    this.data = Object.assign({
      temperature: 0,
      humidity: 0,
      heatIndex: 0
    }, config.data);
  }

  createAccessory() {
    // we don't need to register homekit accessories since they are already defined by zigbee2mqtt
    return null;
  }

  getCustomMetrics() {
    return [
      {
        type: client.Gauge,
        name: 'linkquality',
        help: 'Device\'s link quality'
      }
    ]
  }

  getServices() {
    return [
      {
        name: 'Temperature',
        characteristics: [
          {
            metric: {
              type: client.Gauge,
              name: 'temperature',
              help: 'Current temperature'
            },
            get: data => data.temperature,
            props: {
              minValue: -40,
              maxValue: 80
            }
          }
        ]
      },
      {
        name: 'Humidity',
        characteristics: [
          {
            metric: {
              type: client.Gauge,
              name: 'humidity',
              help: 'Current relative humidity'
            },
            get: data => data.humidity
          }
        ]
      }
    ];
  }

  connect(topic) {
    if (!topic) {
      return;
    }

    if (this.connected) {
      this.disconnect("already_opened");
    }

    this.topic = topic;
    this.connected = true;

    this.mqttClient.subscribe(topic, (err) => {
      if (err) {
        this.log.error('Error subscribing to topic', topic, err);
        this.disconnect();
      }
    })

    this.mqttClient.on('message', (topic, message) => {
      if (!this.topic) {
        return;
      }

      if (topic !== this.topic) {
        return;
      }

      this.getData(message);
    });

    this.emit('connected');

    this.metrics.connected.set({model: this.model, sno: this.sno}, 1);
  }

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

        const existingMetric = this.register.getSingleMetric(rest.name)

        if (existingMetric) {
          characteristic.metric.instance = existingMetric;
        } else {
          characteristic.metric.instance = new MetricType({
            ...rest,
            labelNames: ["model", "sno"]
          });
          this.register.registerMetric(characteristic.metric.instance);
        }
      }

      if (characteristic.get) {
        const value = characteristic.get(this.data);

        this.log('Get', service.name, this.model, this.sno, value);

        if (characteristic.metric && characteristic.metric.instance) {
          characteristic.metric.instance.set({model: this.model, sno: this.sno}, value);
        }
      }
    })
  }

  disconnect(reason = "no_reason") {
    if (!this.connected) {
      return;
    }

    this.deviceWillDisconnect();

    if (this.connection && this.topic) {
      this.connection.unsubscribe(this.topic);
    }

    this.log("Disconnected due to reason", reason);

    this.connection = null;
    this.connected = false;
    this.topic = '';

    this.emit('disconnected');

    this.metrics.connected.set({model: this.model, sno: this.sno}, 0);

    this.deviceDidDisconnect();
  }

  onGetDefaultMetrics(data) {
    if (!data) {
      return;
    }

    Object.keys(data).forEach(metric => {
      const existingMetric = this.register.getSingleMetric(metric);

      if (!existingMetric) return;

      existingMetric.set({model: this.model, sno: this.sno}, data[metric]);
    });
  }

  getData(raw) {
    const {temperature, humidity, linkquality} = JSON.parse(raw);
    const data = {
      temperature,
      humidity,
    };
    const metrics = {
      linkquality,
    };
    this.setData(data, true);

    if (this.register) {
      this.onGetMetrics(metrics);
      this.onGetDefaultMetrics(data);
      this.onGetCustomDataMetrics(data);
    }
  }
}

module.exports = ZigbeeDevice;