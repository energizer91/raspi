const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/raspi', { useNewUrlParser: true });

const devices = new mongoose.Schema({
  uid: String,
  vid: String,
  pid: String,
  sno: String,
  model: String,
  active: { type: Boolean, default: true }
});

module.exports = {
  Device: mongoose.model('Device', devices)
};
