/*var express = require('express');
var app = express();
const router = express.Router();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);*/
var usermodel = require('./models/user');
var rq = require('./public/js/rooms');
var exports = module.exports = {};
var queue = new rq();
exports.room = queue;
exports.serv = function (express, app, io){
  
  var players = {};
  var usernames = {};
  
  xcoords = [1500, 885, 677, 1553, 499];
  ycoords = [1495, 1693, 448, 967, 1171];
  var star = {
    x: xcoords[Math.floor(Math.random() * 4)],
    y: ycoords[Math.floor(Math.random() * 4)]
  };

  var scores = {
    blue: 0,
    red: 0,
    hp_1st: 100,
    hp_2nd: 100
  };

  app.use(express.static(__dirname + '/public'));

  io.sockets.on('connection', function (socket) {
    
    socket.on('adduser', function () {
      var user = require("./app");
      socket.username = user.name;
      socket.roomchoice = queue.addPlayer(socket.username);
      //console.log(socket.roomchoice);
      socket.join(socket.roomchoice);
      
      
      //console.log(socket.username);
      // Creeaza un nou jucator si il adauga la obiectul Players
      players[socket.id] = {
        rotation: 0,
        t: 0,
        //Alegem la intamplare una din 5 pozitii de inceput
        //Din vectorii xcoords si ycoords care reprezinta coordonatele
        x: xcoords[Math.floor(Math.random() * 4)],
        y: ycoords[Math.floor(Math.random() * 4)],
        playerId: socket.id,
        team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue',
        room: socket.roomchoice, 
        created: 0,
        username: socket.username
      };
      console.log('a user connected: ', 
        socket.username, ' ', 
        socket.id, 'in room',
        socket.roomchoice);
      usernames[socket.username] = socket.username;


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
      //io.sockets.in(socket.roomchoice).emit('scoreUpdate', scores);
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
      //io.emit('disconnect', socket.id, socket.room);
      io.sockets.in(socket.roomchoice).emit('disconnect', socket.id, socket.room);
      //queue.removePlayer(socket.roomchoice, socket.id);
      queue.removeRoom(socket.roomchoice);
      //queue.getrooms();
      //io.sockets.get('/');
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

      socket.to(socket.roomchoice).emit('shotFired', bulletData);
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
      if (players[id])
        console.log(players[id].username, 'a fost distrus de o bomba!!');
      io.sockets.in(socket.roomchoice).emit('destroySelf', id);
    });

    socket.on('gameover', function (room, winner) {
      //Meciul trebuie distrus o data cu castigul acestuia de catre unul din jucator
      //Socketurile trebuie sa paraseasca meciul. 
      //Winnerul se stabilste dupa id
  
      if (socket.id === winner){
        console.log(players[winner].username, 'a castigat in meciul', room);
        usermodel.updateOne({name : socket.username}, 
                            {$inc: {wins: 1}}).exec();
      }
        usermodel.updateOne({name : socket.username}, 
                          {$inc: {losses: 1}}).exec();
      socket.leave(socket.roomchoice);
      delete players[socket.id];
      queue.removeRoom(socket.roomchoice);
      //queue.getrooms();
      app.get('/', function (req, res) {
        res.redirect('/');        
        
      });
    });

    socket.on('starCollected', function () {
      star.x = xcoords[Math.floor(Math.random() * 4)];
      star.y = ycoords[Math.floor(Math.random() * 4)];
      io.sockets.in(socket.roomchoice).emit('starLocation', star);
      
      //io.sockets.in(socket.roomchoice).emit('scoreUpdate', scores);
    });


  });
}