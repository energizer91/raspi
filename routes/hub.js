const express = require('express');
const router = express.Router();
const { smartHub } = require('../models');

router.get('/devices', function(req, res) {
  const devices = smartHub.getRegisteredDevices();

  return res.json(Object.values(devices).map(device => ({
    uid: device.uid,
    name: device.name,
    connected: device.connected,
    registered: device.registered
  })));
});

router.get('/devices/:device', (req, res) => {
  const device = smartHub.getDevice(req.params.device);

  return res.json({
    uid: device.uid,
    name: device.name,
    connected: device.connected,
    registered: device.registered,
    data: device.data
  });
});

router.post('/devices/:device/send', (req, res, next) => {
  const device = smartHub.getDevice(req.params.device);
  const { data } = req.body;

  if (!device.connected) {
    return next(new Error('Device is not connected'));
  }

  device.setData(data);

  return res.send('ok');
});

router.get('/devices/:device/data', (req, res, next) => {
  const device = smartHub.getDevice(req.params.device);

  if (!device.connected) {
    return next(new Error('Device is not connected'));
  }

  return device.getData()
    .then(response => res.json(response))
    .catch(next);
});

router.get('/switch/signal/:signal', (req, res, next) => {
  const device = smartHub.getDevice('03cef9e0-d77d-11e8-a560-e79cff6a8292');

  if (['brightness', 'color', 'enabled'].indexOf(req.params.signal) < 0) {
    return next(new Error('Unknown signal'));
  }

  if (!device.connected) {
    return next(new Error('Device is not connected'));
  }

  device.sendSignal({ key: req.params.signal, value: req.query.value });

  return res.send('ok');
});

router.get('/uid', (req, res, next) => {
  res.send(smartHub.api.generateUid());
});

module.exports = router;
