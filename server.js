var url         = require('url');
var http        = require('http');
var express     = require('express');
var ws          = require('ws');
var browserify  = require('connect-browserify');
var Swarm       = require('swarm');

var Text            = require('swarm/lib/Text');
var FileStorage     = require('swarm/lib/FileStorage');
var EinarosWSStream = require('swarm/lib/EinarosWSStream');
var TodoList        = require('./js/models/TodoList');
var TodoItem        = require('./js/models/TodoItem');

var storage   = new FileStorage('.swarm');
var host      = new Swarm.Host('swarm~nodejs', 0, storage);

Swarm.debug = true;
Swarm.localhost = host;

var app     = express()
                .use('/js/bundle.js', browserify({entry: './js/app.js', debug: true}))
                .use(express.static('.'));

var server  = http.createServer(app);

var wsApp   = new ws.Server({server: server});

// add pipes
wsApp.on('connection', function(sock) {
  var params = url.parse(sock.upgradeReq.url,true);
  console.log('incomingWS %s', params.path);
  // check the secret
  // FIXME grant ssn
  host.accept(new EinarosWSStream(sock));
});

server.listen(3000, function() {
  console.log('server started on localhost:3000');
});

// TODO pexing
