const express = require('express');
const router = express.Router();

router.get('/devices', function(req, res) {
  const devices = req.smartHub.getRegisteredDevices();

  return res.json(Object.values(devices).map(device => ({
    uid: device.uid,
    name: device.name,
    connected: device.connected,
    registered: device.registered
  })));
});

router.get('/devices/:device', (req, res, next) => {
  const device = req.smartHub.getDeviceInstance(req.params.device);

  if (!device) {
    return next(new Error('Device not found'));
  }

  return res.json({
    uid: device.uid,
    name: device.name,
    connected: device.connected,
    registered: device.registered,
    data: device.data
  });
});

router.post('/devices/:device/send', (req, res, next) => {
  const device = req.smartHub.getDeviceInstance(req.params.device);
  const { data } = req.body;

  if (!device) {
    return next(new Error('Device not found'));
  }

  if (!device.connected) {
    return next(new Error('Device is not connected'));
  }

  device.setData(data);

  return res.send('ok');
});

router.post('/devices/:device/register', (req, res, next) => {
  const device = req.smartHub.getDeviceInstance(req.params.device);

  if (!device) {
    return next(new Error('Device not found'));
  }

  if (!device.connected) {
    return next(new Error('Device is not connected'));
  }

  req.smartHub.emit('newDevice', device);

  return res.send('ok');
});

router.post('/devices/:device/unregister', (req, res, next) => {
  const device = req.smartHub.getDeviceInstance(req.params.device);

  if (!device) {
    return next(new Error('Device not found'));
  }

  req.smartHub.emit('removeDevice', device);

  return res.send('ok');
});

router.get('/devices/:device/data', (req, res, next) => {
  const device = req.smartHub.getDeviceInstance(req.params.device);

  if (!device) {
    return next(new Error('Device not found'));
  }

  if (!device.connected) {
    return next(new Error('Device is not connected'));
  }

  return device.getData()
    .then(response => res.json(response))
    .catch(next);
});

router.get('/devices/:device/dweet', (req, res, next) => {
  const device = req.smartHub.getDeviceInstance(req.params.device);

  if (!device) {
    return next(new Error('Device not found'));
  }

  return res.send(`https://dweet.io:443/follow/${device.uid}`);
});

router.get('/device/:device/signal/:signal', (req, res, next) => {
  const device = req.smartHub.getDeviceInstance(req.params.device);

  if (!device) {
    return next(new Error('Device not found'));
  }

  if (['brightness', 'color', 'enabled'].indexOf(req.params.signal) < 0) {
    return next(new Error('Unknown signal'));
  }

  if (!device.connected) {
    return next(new Error('Device is not connected'));
  }

  device.sendSignal({ key: req.params.signal, value: req.query.value });

  return res.send('ok');
});

router.get('/uid', (req, res) => {
  res.send(req.smartHub.api.generateUid());
});

module.exports = router;
