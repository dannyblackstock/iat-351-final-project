var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// GET /style.css etc
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('rgbMsg', function(msg){
    io.emit('rgbMsg', msg);
  });

  socket.on('fingerMsg', function(msg){
    io.emit('fingerMsg', msg);
  });

  socket.on('sendImg', function(imgURL) {
    socket.broadcast.emit('getImg', imgURL);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});