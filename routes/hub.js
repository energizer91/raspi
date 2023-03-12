const express = require('express');
const router = express.Router();

router.get('/devices', function(req, res) {
  const devices = req.smartHub.getRegisteredDevices();

  return res.json(Array.from(devices).map(([_, device]) => ({
    uid: device.uid,
    name: device.name,
    connected: device.connected,
    registered: device.registered
  })));
});

router.get('/devices/db', (req, res, next) => {
  const api = req.smartHub.getApi();

  api.getAllDevices()
    .then(devices => res.json(devices))
    .catch(next);
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

router.post('/devices/mock', (req, res, next) => {
  const devices = require('../models/filebase');

  const database = req.smartHub.getApi().getDatabase();

  database.Device.bulkCreate(devices)
    .then(() => res.send('ok'))
    .catch(next);
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

router.post('/devices/add', async (req, res, next) => {
  const {vid, pid, sno, model, data} = req.body;

  const found = await req.smartHub.api.getDeviceByVendorData(vid, pid, sno);

  if (found) {
    return next(new Error('Device is already added'));
  }

  const device = await req.smartHub.api.registerDevice(pid, vid, sno, model, data);

  req.smartHub.registerDevice(device);

  return res.send('ok');
})

router.post('/devices/:device/register', (req, res, next) => {
  const device = req.smartHub.getDeviceInstance(req.params.device);

  if (!device) {
    return next(new Error('Device not found'));
  }

  // if (!device.connected) {
  //   return next(new Error('Device is not connected'));
  // }

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



router.post('/devices/:device/disconnect', (req, res, next) => {
  const device = req.smartHub.getDeviceInstance(req.params.device);

  if (!device) {
    return next(new Error('Device not found'));
  }

  if (!device.connected) {
    return next(new Error('Device is not connected'));
  }

  device.disconnect();

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

router.get("/metrics", (req, res, next) => {
  const register = req.register;

  res.setHeader('Content-Type', register.contentType);

  register.metrics()
    .then((metrics) => res.send(metrics))
    .catch(next);
})

module.exports = router;
