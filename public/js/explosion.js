var Explosion = new Phaser.Class({

  Extends: Phaser.GameObjects.Particles.ParticleEmitterManager,

  initialize:

  function Explosion (scene){
    Phaser.GameObjects.Particles.ParticleEmitterManager.call (this, scene, 'spark');
    
  }


})