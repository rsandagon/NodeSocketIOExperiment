#!/usr/bin/env node

var socketIo = require('socket.io'),
    events = require('events'),
    HttpServer = require('./HttpServer'),    
    StaticServlet = require('./StaticServlet'),
    express = require('express')();

var DEFAULT_PORT = 8000;
var EXPRESS_PORT = 8889;
var io;

function main(argv) {
  var server = new HttpServer({
    'GET': createServlet(StaticServlet),
    'HEAD': createServlet(StaticServlet)
  }).start(Number(argv[2]) || DEFAULT_PORT).server;

  io = socketIo.listen(server);
  
  io.sockets.on('connection', function (socket) {
    socket.on('subscribe', function(channel) {
      console.log("subscribing to " + channel);
      socket.join(channel);
    });
    socket.on('unsubscribe', function(channel) {
      console.log("unsubscribing to " + channel);
      socket.leave(channel);
    });
  });
}

function createServlet(Class) {
  var servlet = new Class();
  return servlet.handleRequest.bind(servlet);
}

express.listen(EXPRESS_PORT);

express.post('/',function (req, res) {
  console.log('body:'+req);
  var body ='';
  req.on("data", function(data) {
    body += data;
  });
  var event;
  req.on("end", function(){
    message = JSON.parse(body);
    console.log("emiting to " + message.channel +": " + message.event);
    io.sockets.in(message.channel).emit('event', message.event);
  });
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end('{}');
});

// Must be last,
main(process.argv);