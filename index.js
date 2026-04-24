const scheduleTask = require('./scheduler');

scheduleTask("heartbeat", 10000, () => {
  console.log("running");
});