const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const config = require('../config/database');
const bcrypt = require('bcrypt');

module.exports = function(passport){
  //Strategie locala
  passport.use(new LocalStrategy(function(username, password, done){
    // Verifica daca se potriveste numele de utilizator
    // Cu vreuna din intrarile din baza de date
    let query = {username:username};
    User.findOne(query, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, {message: 'Acest utilizator nu există în baza de date.'});
      }

      // Compara parolele folosind o metoda interna a bibliotecii bcrypt
      bcrypt.compare(password, user.password, function(err, isMatch){
        if(err) throw err;
        if(isMatch){
          return done(null, user);
        } else {
          return done(null, false, {message: 'Parola este greşită.'});
        }
      });
    });
  }));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
}