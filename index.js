var process = require('child_process');
var http = require('http');
var Milight = require('node-milight-promise').MilightController;
var Commands = require('node-milight-promise').commands;

function sendOk(res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Success');
}

function sendNotOk(res) {
  res.writeHead(400, {'Content-Type': 'text/plain'});
  res.end('Failed');
}

var SERVICE_PATH = 'sudo /usr/sbin/service motion ';
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
    return SERVICE_PATH + 'start';
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

  return SERVICE_PATH + 'stop';
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

var milight = new Milight({
        ip: "192.168.1.109",
        delayBetweenCommands: 35,
        commandRepeat: 3
    });

function isDayLight() {
  var date = new Date();
  var hourNow = date.getHours();
  return hourNow >= 23 && hourNow < 17;
}

function turnOnMilight() {
  if (!isDayLight()) {
    turnGroups([1,2], true);
  }
}

function turnOffMilight() {
  turnGroups([1], false);
  if (!isDayLight()) {
    setTimeout(function () {
      turnGroups([2], true, { directly: true });
    }, 1000);
  }
}

function turnGroups(groups, state, options) {
  options = options || {};
  if (state) {
    groups.forEach(function (group) {
      milight.sendCommands(Commands.rgbw.on(group), Commands.rgbw.whiteMode(group), Commands.rgbw.brightness(options.directly ? 100 : 20));
    });

    if (!options.directly) {
      milight.pause(500);

      groups.forEach(function (group) {
        milight.sendCommands(Commands.rgbw.on(group), Commands.rgbw.brightness(100));
      });
    }
  } else {
    groups.forEach(function (group) {
      milight.sendCommands(Commands.rgbw.off(group));
    });
  }
}
