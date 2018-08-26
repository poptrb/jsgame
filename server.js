var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var players = {};
var usernames = {};
var rooms = ['r1', 'r2'];
var star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
};
var scores = {
  blue: 0,
  red: 0
};

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket) {
  //socket.broadcast.emit('roomInfo', rooms);
  socket.on('adduser', function (username, roomchoice) {
    socket.join(roomchoice);
    socket.username = username;
    // Creeaza un nou jucator si il adauga la obiectul Players
    players[socket.id] = {
      rotation: 0,
      t: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue',
      room: roomchoice, //(Math.floor(Math.random() * 2) == 0) ? 'r1' : 'r2',
      created: 0
    };
    console.log(players[socket.id].room);
    socket.room = players[socket.id].room; //players[socket.id].team === 'red' ? 'r1' : 'r2';
    console.log('a user connected: ', username, 'in room', socket.room);
    usernames[username] = username;
    
    
    //socket.to(socket.room).emit('currentPlayers', players, socket.room);

    // Trimite obiectul players noului jucator send the players object to the new player
    io.sockets.in(socket.room).emit('currentPlayers', players, socket.room);
    players[socket.id].created = 1;
    // Trimite obiectul steluta 
    io.sockets.in(socket.room).emit('starLocation', star);
    // Trimite scorurile 
    io.sockets.in(socket.room).emit('scoreUpdate', scores);
    // Informeaza toti ceilalti jucatori de cel nou venit
    //socket.broadcast.emit('newPlayer', players[socket.id]);
    socket.broadcast.to(socket.room).emit('newPlayer', players[socket.id], socket.room);

    
  });
  
  // Cand un singur jucator se deconecteaza, ii eliminam din obiectul Players
  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
    socket.leave(socket.room);
    delete players[socket.id];
    // Emite un mesaj catre toti jucatorii sa elimine acest jucator din meciul lor
    io.emit('disconnect', socket.id);
  });

  // Cand un jucator se misca, updateaza datele acestuia pe server
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    players[socket.id].t = movementData.t;
   
    // Emite un mesaj catre toti jucatorii ca cineva s-a miscat
    socket.to(socket.room).emit('playerMoved', players[socket.id]);
  });

  socket.on('bulletFired', function (bulletData) {

    socket.to(socket.room).emit('shotFired',bulletData);
  });
  /*socket.on('bulletMovement', function(positionData){

  });*/
  // Codul pentru 
  socket.on('starCollected', function () {
    if (players[socket.id].team === 'red') 
    {
      scores.red += 10;
    }
    else 
    {
      scores.blue += 10;
    }
    star.x = Math.floor(Math.random() * 700) + 50;
    star.y = Math.floor(Math.random() * 500) + 50;
    io.sockets.in(socket.room).emit('starLocation', star);
    io.sockets.in(socket.room).emit('scoreUpdate', scores);
  });
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});