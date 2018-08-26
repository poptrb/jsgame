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
      debug: true,
      gravity: {y: 0}
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

function preload() 
{
  this.load.image('ship', 'assets/tankbody.png');
  this.load.image('otherPlayer', 'assets/enemyBlack5.png');
  this.load.image('star', 'assets/star_gold.png');
  this.load.image('background', 'assets/bg2.jpg');
  this.load.image('reticle', 'assets/crosshair.png');
  this.load.image('bullet', 'assets/player_bullet.png');
  this.load.image('turela', 'assets/tankturret.png');
  this.load.image('spark', 'assets/particle.png');
}

function create() 
{
  var self = this;
  this.socket = io().connect('http://localhost:8081');
  this.otherPlayers = this.physics.add.group();
  this.otherTurrets = this.physics.add.group();
  //this.otherPlayers.enableBody = true;
  /*this.otherPlayers.physicsBodyType = Phaser.Physics.ARCADE;*/

  //var particles = this.add.particles('spark');
  var emitter0 = self.add.particles('spark').createEmitter({
                x: 0,
                y: 0,
                speed: { min: -800, max: 800 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.5, end: 0 },
                blendMode: 'ADD',
                active: true,
                lifespan: 300,
                gravityY: 800
              });

  this.physics.world.setBounds(0,0, 1024 *2, 1024*2);
  this.cameras.main.setBounds(0, 0, 1024 * 2, 1024 * 2);
  this.velocity = 0;
    for (y = 0; y < 2; y++)
    {
        for (x = 0; x < 2; x++)
        {
            this.add.image(1024 * x, 1024 * y, 'background').setOrigin(0).setAlpha(0.75);
        }
    }
  
  playerBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
  enemyBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });

  ///wrooms
  this.socket.on('connect', function(){
		// call the server-side function 'adduser' and send one parameter (value of prompt)
		this.socket.emit('adduser', prompt("What's your name?"));
	});

  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });

  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
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

  this.socket.on('shotFired', function (bulletData) 
  {
    var enemy_bullet = enemyBullets.get().setActive(true).setVisible(true);
    if (enemy_bullet){
      enemy_bullet.fire(bulletData.ship_pos, bulletData.target);
    }
  });

  this.cameras.main.setDeadzone(400, 200);
  this.cursors = this.input.keyboard.createCursorKeys();
  
  this.blueScoreText = this.add.text(16, 16, '',
   { fontSize: '32px', fill: '#0000FF' });
  this.redScoreText = this.add.text(584, 16, '',
   { fontSize: '32px', fill: '#FF0000' });
  
  this.socket.on('scoreUpdate', function (scores) 
  {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);
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

    // Exit pointer lock when Q or escape (by default) is pressed.
  this.input.keyboard.on('keydown_Q', function (event) {
        if (game.input.mouse.locked)
            game.input.mouse.releasePointerLock();
    }, 0, this);

    // Move reticle upon locked pointer move
  this.input.on('pointermove', function (pointer) 
  {
        if (this.input.mouse.locked)
        {
            reticle.x += pointer.movementX;
            reticle.y += pointer.movementY;
        }
  }, this);

  this.input.on('pointerdown', function (pointer, time)
  {
        var bullet = playerBullets.get().setActive(true).setVisible(true);
        if (bullet)
        {
            bullet.fire(this.ship, reticle);
            this.physics.add.collider(this.otherPlayers, bullet, function(){
              bullet.explode();
              
              var landingzone = bullet.getxy;
            
              emitter0.explode();
            });
            this.socket.emit('bulletFired', 
            { 
              ship_pos: this.ship,
              target: reticle
            });
        }
    }, this);
    //this.physics.world.collide(this.otherPlayers, this.ship);
}


function addPlayer(self, playerInfo) {

  self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5)
  .setDisplaySize(150, 200).setCollideWorldBounds(true);
  self.turret = self.physics.add.image(playerInfo.x, playerInfo.y, 'turela').setOrigin(0.5, 0.47)
  .setDisplaySize(150, 200).setCollideWorldBounds(true);
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
  /*self.enemyship*/
  const otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship')
    .setOrigin(0.5, 0.5).setDisplaySize(150, 200);
  const otherTurret = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'turela')
    .setOrigin(0.5, 0.5).setDisplaySize(150, 200);
  
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
  if (this.ship) {
    
    this.cameras.main.zoom = 0.5;
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
    }else if(this.cursors.down.isDown) {
      this.ship.body.setAcceleration(-250);
      this.turret.body.setAcceleration(-250);
      this.physics.velocityFromRotation(this.ship.rotation + 1.5, -100, this.ship.body.acceleration);
      this.physics.velocityFromRotation(this.ship.rotation + 1.5, -100, this.turret.body.acceleration);
    } else {
      this.ship.setAcceleration(0);
      this.turret.setAcceleration(0);
    }
    
          

      // emit player movement
    var x = this.ship.x;
    var y = this.ship.y;
    var r = this.ship.rotation;
    rotIRTret = Math.atan2(reticle.x-this.ship.x , reticle.y-this.ship.y); 
      // unghiul dintre turela si tinta de pe ecran
    this.turret.rotation = (rotIRTret < 0 ? 2 * Math.PI - rotIRTret: -rotIRTret);

    var rt = this.turret.rotation;
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
      // save old position data
    this.ship.oldPosition = 
    {
      x: this.ship.x,
      y: this.ship.y,
      rotation: this.ship.rotation,
      tur_rotation: this.turret.rotation
    };

  }
}