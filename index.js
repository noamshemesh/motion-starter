var process = require('child_process');
var http = require('http');

function sendOk(res) { 
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Success');
}

function sendNotOk(res) {
  res.writeHead(400, {'Content-Type': 'text/plain'});
  res.end('Failed');
}

var SERVICE_PATH = 'sudo /usr/sbin/service motion ';

http.createServer(function (req, res) {
  if (!req.url) return;

  console.log('Received ' + req.url);

  if (req.url.indexOf('start') >= 0) {
    command = SERVICE_PATH + 'start';
  } else if (req.url.indexOf('stop') >= 0) {
    command = SERVICE_PATH + 'stop';
  } else if (req.url.indexOf('reboot') >= 0) {
    command = 'sudo reboot';
  } else {
    console.log('Unknown command');
    sendNotOk(res);
    return;
  }

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
}).listen(8125);

console.log('Server running on port 8125');
