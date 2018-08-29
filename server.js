var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var players = {};
var usernames = {};
var rq = require('./public/js/rooms')
var queue = new rq();

var star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
};

var scores = {
  blue: 0,
  red: 0,
  hp_1st: 100,
  hp_2nd: 100
};


app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});


io.sockets.on('connection', function (socket) {
  //socket.broadcast.emit('roomInfo', rooms);
  socket.on('adduser', function (username) {
    socket.roomchoice = queue.addPlayer(socket.id);
    console.log(socket.roomchoice);
    socket.join(socket.roomchoice);
    socket.username = username;
    // Creeaza un nou jucator si il adauga la obiectul Players
    players[socket.id] = {
      rotation: 0,
      t: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue',
      room: socket.roomchoice, //(Math.floor(Math.random() * 2) == 0) ? 'r1' : 'r2',
      created: 0,
      username: socket.username
    };
    //socket.room = players[socket.id].room; //players[socket.id].team === 'red' ? 'r1' : 'r2';
    console.log('a user connected: ', username, ' ' ,socket.id, 'in room', socket.roomchoice);
    usernames[username] = username;
    
    
    //socket.to(socket.room).emit('currentPlayers', players, socket.room);
    
    // Trimite obiectul players noului jucator
    io.sockets.in(socket.roomchoice).emit('currentPlayers', players, socket.roomchoice, socket.id);
    //socket.broadcast.to(socket.id).emit('currentPlayers', players, socket.room);
    players[socket.id].created === 1;
    //io.sockets.in(socket.room).to(socket).emit('currentPlayers', players, socket.room);
    players[socket.id].created = 1;
    // Trimite obiectul steluta 
    io.sockets.in(socket.roomchoice).emit('starLocation', star);
    // Trimite scorurile 
    io.sockets.in(socket.roomchoice).emit('scoreUpdate', scores);
    // Informeaza toti ceilalti jucatori de cel nou venit
    //socket.broadcast.emit('newPlayer', players[socket.id]);
    socket.broadcast.to(socket.roomchoice).emit('newPlayer', players[socket.id], socket.roomchoice);

    
  });
  
  // Cand un singur jucator se deconecteaza, ii eliminam din obiectul Players
  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
    socket.leave(socket.roomchoice);
    delete players[socket.id];
    // Emite un mesaj catre toti jucatorii sa elimine acest jucator din meciul lor
    io.emit('disconnect', socket.id);
    //queue.removePlayer(socket.roomchoice, socket.id);

  });

  // Cand un jucator se misca, updateaza datele acestuia pe server
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    players[socket.id].t = movementData.t;
   
    // Emite un mesaj catre toti jucatorii ca cineva s-a miscat
    socket.to(socket.roomchoice).emit('playerMoved', players[socket.id]);
  });

  socket.on('bulletFired', function (bulletData) {

    socket.to(socket.roomchoice).emit('shotFired',bulletData);
  });
  /*socket.on('bulletMovement', function(positionData){

  });*/
  // Codul pentru 
  socket.on('HPUpdate', (HPdata) => {
    scores.hp_1st = HPdata.php;
    scores.hp_2nd = HPdata.ehp;
    io.sockets.in(socket.roomchoice).emit('newHP', scores, socket.id);
  });

  socket.on('destroyed', function (id) {
    console.log(players[id].username, 'a fost distrus de o bomba!!');
    io.sockets.in(socket.roomchoice).emit('destroySelf', id);
  });
  
  socket.on('gameover', function (room,winner) {
    //Meciul trebuie distrus o data cu castigul acestuia de catre unul din jucator
    //Socketurile trebuie sa paraseasca meciul. 
    //TODO: Camera din queue distrusa.
    console.log(players[winner].username, 'a castigat in meciul' , room);
    socket.leave(socket.roomchoice);
    delete players[socket.id];
    queue.removeRoom(room);
    queue.getrooms();
  });

  socket.on('starCollected', function () {
    if (players[socket.id].team === 'red') 
    {
      scores.red -= 10;
      
    }
    else 
    {
      scores.blue += 10;
    }
    star.x = Math.floor(Math.random() * 700) + 50;
    star.y = Math.floor(Math.random() * 500) + 50;
    io.sockets.in(socket.roomchoice).emit('starLocation', star);
    io.sockets.in(socket.roomchoice).emit('scoreUpdate', scores);
  });

  
});


server.listen(process.env.PORT || 8081, function () {
  console.log(`Listening on ${server.address().port}`);
});