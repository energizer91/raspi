module.exports = function homeBridgeConstructor(homebridge) {
  const SmartHubPlatform = require('./platform')(homebridge);

  console.log("homebridge API version: " + homebridge.version);

  // For platform plugin to be considered as dynamic platform plugin,
  // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
  homebridge.registerPlatform(SmartHubPlatform.package, SmartHubPlatform.friendlyName, SmartHubPlatform, true);
};
