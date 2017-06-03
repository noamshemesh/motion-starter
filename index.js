var process = require('child_process');
var http = require('http');
var request = require('request')

function sendOk(res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Success');
}

function sendNotOk(res) {
  res.writeHead(400, {'Content-Type': 'text/plain'});
  res.end('Failed');
}

var SERVICE_PATH = 'sudo /usr/sbin/service ';
var map = [];

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function start(key) {
  if (!isNumeric(key)) {
    return null;
  }
  console.log('Setting ' + key + ' to true. map is ', map);
  map[key] = true;
  if (map[0] && map[1]) {
    turnOffMilight();
    return SERVICE_PATH + 'motion start && ' + SERVICE_PATH + 'jasper stop';
  }

  return null;
}

function stop(key) {
  if (!isNumeric(key)) {
    return null;
  }

  console.log('Setting ' + key + ' to false. map is ', map);
  map[key] = false;

  turnOnMilight();

  return SERVICE_PATH + 'motion stop && ' + SERVICE_PATH + 'jasper start';
}

http.createServer(function (req, res) {
  if (!req.url) return;

  console.log('Received ' + req.url);

  if (req.url.indexOf('start') >= 0) {
    command = start(req.url[req.url.length - 1] - 1);
  } else if (req.url.indexOf('stop') >= 0) {
    command = stop(req.url[req.url.length - 1] - 1);
  } else {
    console.log('Unknown command');
    sendNotOk(res);
    return;
  }

  if (command) {
    console.log('Executing ' + command);
    var cmd = process.exec(command);

    cmd.stdout.on('data', function(output){
      console.log(output);
    });

    cmd.on('close', function(){
      console.log('Finished');
      sendOk(res);
    });

    cmd.stderr.on('data', function(err){
      sendNotOk(res);
      console.log('Error, printing: ')
      console.log(err);
    });
  } else {
    sendOk(res);
  }
}).listen(8125);

console.log('Server running on port 8125');

function isDayLight() {
  var date = new Date();
  var hourNow = date.getHours();
  return hourNow < 17 || hourNow >= 23;
}

function turnOnMilight() {
  if (!isDayLight()) {
    turnGroups([1,2,4], true);
  }
}

function turnOffMilight() {
  turnGroups([1,2,3], false);
  if (!isDayLight()) {
    setTimeout(function () {
      turnGroups([4], true);
    }, 1000);
  }
}

var groupNames = [ "living_room", "bedroom", "led_strips", "kitchen_table" ]

function turnGroups(groups, state, options) {
  options = options || {};
  if (state) {
    groups.forEach(function (group) {
    	request.post("http://localhost:8123/api/services/light/turn_on", { json: { entity_id: "light." + groupNames[group-1] } })
    });
  } else {
    groups.forEach(function (group) {
      request.post("http://localhost:8123/api/services/light/turn_off", { json: { entity_id: "light." + groupNames[group-1] } })
    });
  }
}
