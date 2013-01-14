var env = process.env;
if (!( env.TW_ACCT_SID && env.TW_AUTH_TOKEN
    && env.INTERVAL && env.TW_TO && env.TW_FROM
    && env.SINGLY_TOKEN)) {
  console.error('missing required env vars!');
  console.error(env);
  process.exit(1);
}

var request = require('request');
var twClient = require('twilio')(env.TW_ACCT_SID,
                                 env.TW_AUTH_TOKEN);


var previous;
var url = 'https://api.singly.com/services/fitbit/devices'
doCheck();
setInterval(doCheck, parseInt(env.INTERVAL, 10) * 1000 * 60);

function doCheck() {
  console.log('checking...');
  getTracker(env.SINGLY_TOKEN, function(err, device) {
    if (err) return console.error(err);
    var battLevel = device.battery && device.battery.toLowerCase();
    if (!previous) previous = battLevel;
    else if (battLevel && battLevel === 'low' && battLevel !== previous) {
      sendSMS(function(err) {
        if (err) return console.error(err);
        previous = battLevel;
        console.log('sucess!!');
      })
    } else {
      console.log('no change!');
    }
  })

}

function getTracker(token, callback) {
  request.get({uri:url, qs:{access_token:token}, json:true},
      function(err, resp, devices) {
    if (err) return callback(err, devices);
    for (var i in devices) {
      var dev = devices[i];
      if (dev.data && dev.data.deviceVersion && dev.data.type === 'TRACKER') {
        return callback(null, dev.data);
      }
    }
  });
}


function sendSMS(callback) {
  twClient.sendSms({
    to: env.TW_TO,
    from: env.TW_FROM,
    body: 'Your FitBit Tracker is low!'
  }, callback);
}
