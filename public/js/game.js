var config = {
  type: Phaser.WEBGL,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics:
  {
    default: 'arcade',
    arcade:
    {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
    extend: {
      player: null,
      healthpoints: null,
      reticle: null,
      moveKeys: null,
      playerBullets: null,
      enemyBullets: null,
      time: 0,
    }
  }
};


var game = new Phaser.Game(config);

function preload() {
  this.load.image('ship', 'assets/tankbody.png');
  this.load.image('otherPlayer', 'assets/enemyBlack5.png');
  this.load.image('star', 'assets/star_gold.png');
  //this.load.image('star', 'assets/bb.png');
  this.load.image('background', 'assets/bg2.jpg');
  this.load.image('reticle', 'assets/crosshair.png');
  this.load.image('bullet', 'assets/player_bullet.png');
  this.load.image('turela', 'assets/tankturret.png');
  this.load.image('spark', 'assets/particle.png');
  this.load.image('crater', 'assets/crater.png')
  //date despre harta in format JSON si seturile de tiles
  this.load.image("tiles", "assets/tilemaps/tuxmon-sample-32px.png");
  this.load.tilemapTiledJSON("map", "/assets/tilemaps/gamemap.json");
  
  this.load.atlas('explosion', 'assets/explosion0.png', 'assets/explosion0.json')
  this.load.atlas('explosionDestroy', 'assets/explosionDestroy.png', 'assets/explosionDestroy.json')
}

function create() {

  var self = this;
  this.socket = io();//.connect('http://localhost:8081');

  //Date despre incarcarea hartii 

  const map = this.make.tilemap({key: "map"});
  
  //Fiecare layer separat din harta trebuie incarcat intr-o variabila pentru afisare de catre Phaser
  // Denumirea fiecareia este preluata din cum le-am numit in editorul de harti Tiled
  const tileset = map.addTilesetImage("tuxmon-sample-32px", "tiles");
  const ground = map.createStaticLayer("Ground", tileset, 0, 0);
  const aboveground = map.createStaticLayer("AboveGround", tileset, 0, 0);
  const fence = map.createStaticLayer("Fence", tileset, 0, 0);
  const trees = map.createStaticLayer("Trees", tileset, 0, 0);
  
  aboveground.setCollisionByProperty({ collides: true });
  fence.setCollisionByProperty({ collides: true });
  trees.setCollisionByProperty({ collides: true });
  
  this.collisionLayers = [trees,fence,aboveground];

  //Pt debug sa vedem coliziunile din proprietatile hartii
  /*const debugGraphics = this.add.graphics().setAlpha(0.75);
    trees.renderDebug(debugGraphics, {
      tileColor: null, // Culoare blocurilor fara coliziune
      collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Culoarea celor cu coliziune
      faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Culoarea muchiilor blocurilor cu coliziune
    }); */

  this.otherPlayers = this.physics.add.group();
  this.otherTurrets = this.physics.add.group();
  
  var textureFrames = this.textures.get('explosion').getFrameNames();
  var animFrames = [];
  textureFrames.forEach(function (frameName) {
    animFrames.push({ key: 'explosion', frame: frameName });
  });
  this.anims.create({ key: 'exp', frames: animFrames });

  var textureFrames2 = this.textures.get('explosionDestroy').getFrameNames();
  var animFrames2 = [];
  textureFrames2.forEach(function (frameName) {
    animFrames2.push({ key: 'explosionDestroy', frame: frameName });
  });
  this.anims.create({ key: 'expD', frames: animFrames2 });

  this.physics.world.setBounds(0, 0, 1024 * 2, 1024 * 2);
  this.cameras.main.setBounds(0, 0, 1024 * 2, 1024 * 2);
  this.velocity = 0;
  this.once = true;
  this.gameover = false;
  //runChildUpdate forteaza ca la fiecare ciclu de joc sa fie apelata functia update a obiectului
  playerBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
  enemyBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
  
  this.socket.on('connect', function () {
    // Apeleaza functia din server 'addUser' si trimite un parametru
    // Camera nu e ok sa se stabileasca aici. Trebuie trimisa de la server.
    //var room =  (Math.floor(Math.random() * 2) == 0) ? 'r1' : 'r2'
    self.socket.emit('adduser', prompt("Cum te cheama?"));
    
  });
  //  Rezolvare potentiala bug 
  //  Ar trebui sa avem un singur jucator oponent pe fiecare camera de joc, 
  //  dar o multitudine de jucatori pe server.

  this.socket.on('receiveRoom', function (roomchoice){
    //self.room = roomchoice;
  });
  this.socket.on('currentPlayers', function (players, room, target) {
    if (self.socket.id === target) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id && players[id].created === 0) {
        addPlayer(self, players[id]);
        //console.log('M-am adaugat pe mine insumi', players[id].username);
        self.collisionLayers.forEach(function (entry) {
          self.physics.add.collider(self.ship, entry);
          self.physics.add.collider(self.turret, entry);
        });
        self.player = players[id];
        self.room = room;
        console.log('You: ',self.player.playerId);
        if (self.otherPlayers.getChildren().length > 0) {
          self.gameOpponent = self.otherPlayers.getChildren()[0];
          console.log('The opponent: ', self.gameOpponent.playerId);
        }

      } else 
         if (room === players[id].room) {
           console.log('equal');
        addOtherPlayers(self, players[id]);
      }
    });
    }
  });

  this.socket.on('newPlayer', function (playerInfo, room) {
    //Adauga un singur jucator pentru celalalt deja existent.
    if (room === playerInfo.room ){
      addOtherPlayers(self, playerInfo);
      // Vrem id-ul oponentului doar din aceasta camera
      self.gameOpponent = self.otherPlayers.getChildren()[0];
      console.log('You: ',self.player.playerId);
      console.log('The opponent: ', self.gameOpponent.playerId);
    }
  });

  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
    self.otherTurrets.getChildren().forEach(function (otherTurret) {
      if (playerId === otherTurret.playerId) {
        otherTurret.destroy();
      }
    alert('Celalt jucator s-a deconectat.');
    self.winner = self.socket.id;
    self.socket.emit('gameover', self.room, self.winner);
    self.scene.destroy();
    });
  });

  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
    self.otherTurrets.getChildren().forEach(function (otherTurret) {
      if (playerInfo.playerId === otherTurret.playerId) {
        otherTurret.setRotation(playerInfo.t);
        otherTurret.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });

  this.socket.on('shotFired', function (bulletData) {
    var enemy_bullet = enemyBullets.get().setActive(true).setVisible(true);
    if (enemy_bullet) {
      enemy_bullet.fire(bulletData.ship_pos, bulletData.target);
    }
  });

  this.cameras.main.setDeadzone(400, 200);
  this.cursors = this.input.keyboard.createCursorKeys();

  // Date despre hit-points ale tancurilor
  this.enemyHP = this.HP = 100;
  this.HPtext = this.add.text(0, 0, this.HP,
   { fontSize: '26px', fill: '#0000FF' }).setVisible(false);
  this.enemyHPtext = this.add.text(0, 0, this.enemyHP,
   { fontSize: '26px', fill: '#0000FF' }).setVisible(false);


  this.blueScoreText = this.add.text(0, 0, '',
    { fontSize: '32px', fill: '#0000FF' });
  this.redScoreText = this.add.text(584, 16, '',
    { fontSize: '32px', fill: '#FF0000' });

  this.socket.on('scoreUpdate', function (scores) {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);
  });

  this.socket.on('newHP', function (scores, playerID) {
    if (playerID === self.socket.id) {
      //Suntem pe ramura in care noi insine suntem jucatorul
      self.HP = scores.hp_1st;
      self.HPtext.setText(self.HP);
      self.enemyHP = scores.hp_2nd;
      self.enemyHPtext.setText(self.enemyHP);
    }
      else 
    {
      self.enemyHP = scores.hp_1st;
      self.enemyHPtext.setText(self.enemyHP);
      self.HP = scores.hp_2nd;
      self.HPtext.setText(self.HP);
    }

    if (self.HP < 0 && !(self.gameover)){
      self.socket.emit('destroyed', self.socket.id);
      self.gameover = true;
      self.winner = self.socket.id;
    }
    else if ((self.enemyHP < 0) &&  !(self.gameover)){
      self.socket.emit('destroyed', self.gameOpponent.playerId); 
      self.gameover = true;
      self.winner = self.gameOpponent.playerId;
      self.add.image(self.gameOpponent.x, self.gameOpponent.y, 'crater');
      const explosionSprite = self.add.
        sprite(self.gameOpponent.x  , self.gameOpponent.y - 60, 'explosionDestroy').
          setScale(0.7, 0.7).play('expD');
      self.gameOpponent.destroy();
      self.otherTurrets.getChildren()[0].destroy();
      removeExplosion(explosionSprite, 750);
    }
    if (self.gameover)
      self.socket.emit('gameover', self.room, self.winner)
  });

  this.socket.on('destroySelf', function (id) {
    if (self.socket.id === id) {
      self.add.image(self.ship.x, self.ship.y, 'crater');
      const explosionSprite = self.add
        .sprite(self.ship.x, self.ship.y - 60, 'explosionDestroy')
        .setScale(0.7, 0.7)
        .play('expD');
      self.ship.destroy();
      self.turret.destroy();
      removeExplosion(explosionSprite, 750);
    }
  });

  
  this.socket.on('starLocation', function (starLocation) {
    if (self.star) self.star.destroy();
    self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
    self.physics.add.overlap(self.ship, self.star, function () {
      this.socket.emit('starCollected');
    }, null, self);
  });

  reticle = this.physics.add.sprite(800, 700, 'reticle');
  reticle.setOrigin(0.5, 0.5).setDisplaySize(45, 45).setCollideWorldBounds(true);

  game.canvas.addEventListener('mousedown', function () {
    game.input.mouse.requestPointerLock();
  });

  // Elibereaza mouse-ul cand este apasat Q sau Escape
  this.input.keyboard.on('keydown_Q', function (event) {
    if (game.input.mouse.locked)
      game.input.mouse.releasePointerLock();
  }, 0, this);

  // Misca tinta cand mouse-ul este activ in fereastra
  this.input.on('pointermove', function (pointer) {
    if (this.input.mouse.locked) {
      reticle.x += pointer.movementX;
      reticle.y += pointer.movementY;
    }
  }, this);

  this.input.on('pointerdown', function (pointer, time) {
    var bullet = playerBullets.get().setActive(true).setVisible(true);
    if (bullet) {
      bullet.fire(this.ship, reticle);
      // Coliziune cu celalalt jucator, unde se va emite un eveniment catre server
      // care semnifica ca celalalt jucator a fost lovit.
      // La impact se activeaza o explozie, iar glontul dispare.
      this.physics.add.collider(this.otherPlayers, bullet, (bullet, otherPlayers)=>{
        if (bullet.active === true)//) && enemyHit.active === true)
        {
          console.log("hit");
          const explosionSprite = self.add
            .sprite(bullet.x, bullet.y, 'explosion')
            .setScale(1.5, 1.5)
            .play('exp');
          this.socket.emit('HPUpdate',
          {
            ehp:this.enemyHP - 25,
            php:this.HP,
            player: self.socket.id,
            enemy: self.gameOpponent.playerId
          });
          
          // Destroy bullet
          bullet.setActive(false).setVisible(false);
          removeExplosion(explosionSprite, 3000);
        }
      });
      }
      this.socket.emit('bulletFired',
        {
          ship_pos: this.ship,
          target: reticle
        });
      
  }, this);
  
  
}

function destroyBomb(explosion, t) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(explosion.destroy());
    }, t);
  });
} 

async function removeExplosion(explosion, t){
  await destroyBomb(explosion, t);
}

function addPlayer(self, playerInfo) {

  self.ship = self.physics.add
  .image(playerInfo.x, playerInfo.y, 'ship')
  .setSize(500,500,true)
  .setOrigin(0.5, 0.5)
  .setDisplaySize(90, 120)
  .setCollideWorldBounds(true);
  self.turret = self.physics.add
  .image(playerInfo.x, playerInfo.y, 'turela')
  .setSize(500,500,true)
  .setOrigin(0.5, 0.47)
  .setDisplaySize(90, 120)
  .setCollideWorldBounds(true);
    if (playerInfo.team === 'blue') {
    self.ship.setTint(0xf2fcff);
    self.turret.setTint(0xf2fcff);
  } else {
    self.ship.setTint(0xe5a690);
    self.turret.setTint(0xe5a690);
  }

  self.ship.setDrag(450);
  self.ship.setAngularDrag(1000);
  self.ship.setMaxVelocity(250);

  self.turret.setDrag(450);
  self.turret.setAngularDrag(1000);
  self.turret.setMaxVelocity(250);
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship')
    .setOrigin(0.5, 0.5).setDisplaySize(90, 120);
  const otherTurret = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'turela')
    .setOrigin(0.5, 0.5).setDisplaySize(90, 120);

  if (playerInfo.team === 'blue') {
    otherPlayer.setTint(0xf2fcff);
  } else {
    otherPlayer.setTint(0xe5a690);
  }
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);

  otherTurret.playerId = playerInfo.playerId;
  self.otherTurrets.add(otherTurret);
}

function update() {
  if (this.ship && (!this.gameover)) {
    self = this;
    if (this.once)
      this.HPtext.setVisible(true);
    this.once = false;
    this.HPtext.setText(this.HP);
    this.cameras.main.zoom = 0.65;
    this.cameras.main.startFollow(this.ship, true, 0.05, 0.05);
    if (this.cursors.left.isDown) {
      this.ship.setAngularVelocity(-50);
      this.turret.setAngularVelocity(-50);
    } else if (this.cursors.right.isDown) {
      this.ship.setAngularVelocity(50);
      this.turret.setAngularVelocity(50);

    } else {
      this.ship.setAngularVelocity(0);
    }

    if (this.cursors.up.isDown) {
      this.ship.body.setAcceleration(250);
      this.turret.body.setAcceleration(250);
      this.physics.velocityFromRotation(this.ship.rotation + 1.5, 100, this.ship.body.acceleration);
      this.physics.velocityFromRotation(this.ship.rotation + 1.5, 100, this.turret.body.acceleration);
    } else if (this.cursors.down.isDown) {
      this.ship.body.setAcceleration(-250);
      this.turret.body.setAcceleration(-250);
      this.physics.velocityFromRotation(this.ship.rotation + 1.5, -100, this.ship.body.acceleration);
      this.physics.velocityFromRotation(this.ship.rotation + 1.5, -100, this.turret.body.acceleration);
    } else {
      this.ship.setAcceleration(0);
      this.turret.setAcceleration(0);
    }



    // Emite date despre miscarea jucatorului
    
    this.HPtext.setPosition(this.ship.x -20 , this.ship.y - 100);
    /*if (this.gameOpponent){
      self.enemyHPtext.setVisible(true);
      self.enemyHPtext.setPosition(self.gameOpponent.scene.ship.x -20, self.gameOpponent.scene.ship.y - 100);
    }/**/
    this.turret.x = this.ship.x;
    this.turret.y =this.ship.y;
    var x = this.ship.x;
    var y = this.ship.y;
    var r = this.ship.rotation;
    rotIRTret = Math.atan2(reticle.x - this.ship.x, reticle.y - this.ship.y);
    // unghiul dintre turela si tinta de pe ecran
    this.turret.rotation = (rotIRTret < 0 ? 2 * Math.PI - rotIRTret : -rotIRTret);

    var rt = this.turret.rotation;

    //Daca pozitia jucatorului sau a turelei acesuita s-a schimbat => emite catre server noua pozitie
    if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y
      || r !== this.ship.oldPosition.rotation || rt != this.ship.oldPosition.tur_rotation)) {
      this.socket.emit('playerMovement',
        {
          x: this.ship.x,
          y: this.ship.y,
          rotation: this.ship.rotation,
          t: this.turret.rotation
        });
    }
    // Salveaza datele despre vechea pozitie
    this.ship.oldPosition =
      {
        x: this.ship.x,
        y: this.ship.y,
        rotation: this.ship.rotation,
        tur_rotation: this.turret.rotation
      };

  }
}