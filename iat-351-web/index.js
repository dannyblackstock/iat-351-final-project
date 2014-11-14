var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendfile(__dirname + '/index.html');
});

app.get('/gradient-map.svg', function(req, res){
  res.sendfile(__dirname + '/gradient-map.svg');
});

app.get('/gradient-map.png', function(req, res){
  res.sendfile(__dirname + '/gradient-map.png');
});

io.on('connection', function(socket){
  socket.on('rgbMsg', function(msg){
    io.emit('rgbMsg', msg);
  });

  socket.on('fingerMsg', function(msg){
  	io.emit('fingerMsg', msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});