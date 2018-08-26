var Bullet = new Phaser.Class({

    Extends: Phaser.GameObjects.Image,

    initialize:

    // Constructorul pentru proiectil
    function Bullet (scene)
    {
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet');
        this.speed = 1;
        this.born = 0;
        this.direction = 0;
        this.xSpeed = 0;
        this.ySpeed = 0;
        this.setSize(12, 12, true);
        this.land = 0;
        this.lungime = 0;
        this.yFinal = 0;
        this.finalx = 0;
        this.finaly=0;
        
    },

    // Trage un proiectil dinspre nava catre tinta de pe ecran
    fire: function (shooter, target)
    {
        this.setPosition(shooter.x, shooter.y); // Pozitia intiala
        this.direction = Math.atan( (target.x-this.x) / (target.y-this.y));
        this.finalx = shooter.x;
        this.finaly = shooter.y;
        //Pozitia finala unde va ateriza glontul
        lungime = Math.pow(shooter.x - target.x,2) + Math.pow(shooter.y-target.y,2);
        console.log(Math.sqrt(lungime));
        // Calculeaza viteza pe verticala si orizontala in drumul spre tinta
        if (target.y >= this.y)
        {
            this.xSpeed = this.speed*Math.sin(this.direction);
            this.ySpeed = this.speed*Math.cos(this.direction);
        }
        else
        {
            this.xSpeed = -this.speed*Math.sin(this.direction);
            this.ySpeed = -this.speed*Math.cos(this.direction);
        }

        this.rotation = shooter.rotation; // Unghiul dintre proiectil si orientarea navei
        this.born = 0; // Timpul care a trecut de cand a fost tras
    },

    // Updates the position of the bullet each cycle
    getxy: function () 
    {   
        return {x: this.x, y: this.y};
    },

    update: function (time, delta)
    {
        this.x += this.xSpeed * delta;
        this.y += this.ySpeed * delta;
        this.born += delta;
        
        if (this.born > Math.sqrt(lungime))
        {
            this.landingzone = this.getxy();
            this.explode();
        }
    },

    final : function () {
        return this.landigzone;
    },

    explode: function () {
        this.landingzone = this.getxy();
        this.setActive(false);
        this.setVisible(false);
        this.setPosition(this.finalx, this.finaly)
    }

    
});